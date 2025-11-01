<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use App\Models\UserSkill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SkillController extends Controller
{
    /**
     * Get all available skills
     */
    public function index(Request $request)
    {
        $skills = Skill::all()->groupBy('category');
        
        $user = $request->user();
        $userSkills = $user->skills()->get()->keyBy('id');
        
        // Format response with user's progress
        $formattedSkills = $skills->map(function ($categorySkills, $category) use ($userSkills) {
            return [
                'category' => $category,
                'skills' => $categorySkills->map(function ($skill) use ($userSkills) {
                    $userSkill = $userSkills->get($skill->id);
                    
                    return [
                        'id' => $skill->id,
                        'name' => $skill->name,
                        'category' => $skill->category,
                        'description' => $skill->description,
                        'icon' => $skill->icon,
                        'max_level' => $skill->max_level,
                        'is_unlocked' => $userSkill !== null,
                        'current_level' => $userSkill ? $userSkill->pivot->level : 0,
                        'experience' => $userSkill ? $userSkill->pivot->experience : 0,
                        'unlock_cost' => $skill->getUnlockCost(),
                        'upgrade_cost' => $userSkill ? $skill->getUpgradeCost($userSkill->pivot->level) : null,
                        'efficiency_bonus' => (float) $skill->efficiency_bonus,
                        'project_types' => $skill->project_types,
                    ];
                })->values()
            ];
        })->values();
        
        return response()->json([
            'success' => true,
            'data' => $formattedSkills
        ]);
    }
    
    /**
     * Get user's skills
     */
    public function userSkills(Request $request)
    {
        $user = $request->user();
        $skills = $user->skills()
            ->withPivot(['level', 'experience', 'unlocked_at'])
            ->get()
            ->map(function ($skill) {
                return [
                    'id' => $skill->id,
                    'name' => $skill->name,
                    'category' => $skill->category,
                    'icon' => $skill->icon,
                    'level' => $skill->pivot->level,
                    'experience' => $skill->pivot->experience,
                    'max_level' => $skill->max_level,
                    'efficiency_bonus' => (float) $skill->efficiency_bonus,
                    'upgrade_cost' => $skill->getUpgradeCost($skill->pivot->level),
                    'unlocked_at' => $skill->pivot->unlocked_at,
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $skills
        ]);
    }
    
    /**
     * Unlock a new skill
     */
    public function unlock(Request $request)
    {
        $request->validate([
            'skill_id' => 'required|exists:skills,id'
        ]);
        
        $user = $request->user();
        $skill = Skill::findOrFail($request->skill_id);
        
        // Check if already unlocked
        if ($user->skills()->where('skill_id', $skill->id)->exists()) {
            return response()->json([
                'success' => false,
                'error' => 'Skill already unlocked'
            ], 400);
        }
        
        // Check COMPANY cash, not gameState money
        $company = $user->company;
        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }
        
        $unlockCost = $skill->getUnlockCost();
        
        if ($company->cash < $unlockCost) {
            return response()->json([
                'success' => false,
                'error' => 'Not enough money',
                'required' => $unlockCost,
                'current' => $company->cash
            ], 400);
        }
        
        DB::beginTransaction();
        try {
            // Deduct money from COMPANY cash
            $company->cash -= $unlockCost;
            $company->save();
            
            // Unlock skill at level 1
            $user->skills()->attach($skill->id, [
                'level' => 1,
                'experience' => 0,
                'unlocked_at' => now()
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => "Unlocked {$skill->name}!",
                'data' => [
                    'skill' => $skill,
                    'company' => $company
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Failed to unlock skill'
            ], 500);
        }
    }
    
    /**
     * Upgrade an existing skill
     */
    public function upgrade(Request $request)
    {
        $request->validate([
            'skill_id' => 'required|exists:skills,id'
        ]);
        
        $user = $request->user();
        $skill = Skill::findOrFail($request->skill_id);
        
        $userSkill = UserSkill::where('user_id', $user->id)
            ->where('skill_id', $skill->id)
            ->first();
        
        if (!$userSkill) {
            return response()->json([
                'success' => false,
                'error' => 'Skill not unlocked yet'
            ], 400);
        }
        
        // Check max level
        if ($userSkill->level >= $skill->max_level) {
            return response()->json([
                'success' => false,
                'error' => 'Skill already at max level'
            ], 400);
        }
        
        // Check COMPANY cash, not gameState money
        $company = $user->company;
        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }
        
        $upgradeCost = $skill->getUpgradeCost($userSkill->level);
        
        if ($company->cash < $upgradeCost) {
            return response()->json([
                'success' => false,
                'error' => 'Not enough money',
                'required' => $upgradeCost,
                'current' => $company->cash
            ], 400);
        }
        
        DB::beginTransaction();
        try {
            // Deduct money from COMPANY cash
            $company->cash -= $upgradeCost;
            $company->save();
            
            // Upgrade skill
            $userSkill->level += 1;
            $userSkill->save();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => "{$skill->name} upgraded to level {$userSkill->level}!",
                'data' => [
                    'skill' => $skill,
                    'new_level' => $userSkill->level,
                    'company' => $company,
                    'next_upgrade_cost' => $userSkill->level < $skill->max_level 
                        ? $skill->getUpgradeCost($userSkill->level) 
                        : null
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Failed to upgrade skill'
            ], 500);
        }
    }
}

