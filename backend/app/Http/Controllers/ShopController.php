<?php

namespace App\Http\Controllers;

use App\Models\ShopItem;
use App\Models\UserPurchase;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index(Request $request)
    {
        $items = ShopItem::where('is_available', true)
            ->orderBy('category')
            ->orderBy('order')
            ->get();

        $grouped = $items->groupBy('category');

        return response()->json([
            'success' => true,
            'items' => $items,
            'grouped' => $grouped,
        ]);
    }

    public function purchase(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:shop_items,id',
        ]);

        $user = $request->user();
        $item = ShopItem::findOrFail($request->item_id);
        $company = $user->company;

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        // Check COMPANY cash, not gameState money
        if ($company->cash < $item->price) {
            return response()->json(['error' => 'Not enough money!'], 400);
        }

        // Deduct money from COMPANY cash
        $company->cash -= $item->price;
        $company->save();

        // Create purchase record
        $expiresAt = $item->duration_minutes 
            ? now()->addMinutes($item->duration_minutes)
            : null;

        $purchase = UserPurchase::create([
            'user_id' => $user->id,
            'shop_item_id' => $item->id,
            'purchased_at' => now(),
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);

        // Apply instant effects
        $effectMessage = null;
        if ($item->effect_type === 'instant') {
            $effectMessage = $this->applyInstantEffect($user, $item);
        }

        $message = $effectMessage ?? "Purchased {$item->name}!";

        return response()->json([
            'success' => true,
            'message' => $message,
            'purchase' => $purchase,
            'company' => $company,
        ]);
    }

    public function getActivePurchases(Request $request)
    {
        $user = $request->user();
        
        $purchases = UserPurchase::where('user_id', $user->id)
            ->where('is_active', true)
            ->with('shopItem')
            ->get()
            ->filter(function ($purchase) {
                return $purchase->isActive();
            })
            ->values();

        return response()->json([
            'success' => true,
            'purchases' => $purchases,
        ]);
    }

    private function applyInstantEffect($user, $item)
    {
        $gameState = $user->gameState;
        $effect = $item->effect_data;

        switch ($effect['type'] ?? null) {
            case 'reputation':
                $amount = $effect['amount'] ?? 0;
                $gameState->reputation += $amount;
                $gameState->save();
                return "Gained +{$amount} reputation! 🌟";
            
            case 'skill_xp':
                // Max level a random unlocked skill
                // Find user_skills that can be upgraded (level < max_level)
                $userSkill = \App\Models\UserSkill::where('user_skills.user_id', $user->id)
                    ->join('skills', 'user_skills.skill_id', '=', 'skills.id')
                    ->whereColumn('user_skills.level', '<', 'skills.max_level')
                    ->select('user_skills.*', 'skills.max_level', 'skills.name', 'skills.icon')
                    ->inRandomOrder()
                    ->first();
                
                if ($userSkill) {
                    $oldLevel = $userSkill->level;
                    $userSkill->level = $userSkill->max_level;
                    $userSkill->save();
                    
                    return "⭐ Maxed out {$userSkill->icon} {$userSkill->name} (Lv {$oldLevel} → {$userSkill->max_level})!";
                } else {
                    // If no skill to max, unlock a random locked skill
                    // Find skills that user doesn't have yet
                    $unlockedSkillIds = \App\Models\UserSkill::where('user_id', $user->id)->pluck('skill_id');
                    $lockedSkill = \App\Models\Skill::whereNotIn('id', $unlockedSkillIds)
                        ->inRandomOrder()
                        ->first();
                    
                    if ($lockedSkill) {
                        \App\Models\UserSkill::create([
                            'user_id' => $user->id,
                            'skill_id' => $lockedSkill->id,
                            'level' => 1,
                            'experience' => 0,
                        ]);
                        
                        return "🔓 Unlocked new skill: {$lockedSkill->icon} {$lockedSkill->name}!";
                    }
                    
                    return "💡 All skills are already maxed out!";
                }
            
            case 'complete_project':
                // Complete current project
                $project = $user->projects()->where('status', 'in_progress')->first();
                if ($project) {
                    $project->progress = 100;
                    $project->status = 'completed';
                    $project->save();
                    return "⚡ Instantly completed: {$project->title}!";
                }
                return "No project in progress to complete.";
        }
        
        return null;
    }
}

