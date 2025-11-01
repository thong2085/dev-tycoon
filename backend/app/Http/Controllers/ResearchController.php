<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Models\User;
use Illuminate\Http\Request;

class ResearchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $company = $user->company;
        $companyLevel = $company ? $company->company_level : 1;
        
        $allResearches = Research::orderBy('required_level')->orderBy('cost')->get();
        $unlockedResearchIds = $user->researches->pluck('id')->toArray();
        
        $researches = $allResearches->map(function ($research) use ($user, $unlockedResearchIds, $companyLevel, $company) {
            $isUnlocked = in_array($research->id, $unlockedResearchIds);
            $canAfford = $company && $company->cash >= $research->cost;
            $meetsLevel = $companyLevel >= $research->required_level;
            $canUnlock = !$isUnlocked && $canAfford && $meetsLevel;
            
            return [
                ...$research->toArray(),
                'is_unlocked' => $isUnlocked,
                'can_afford' => $canAfford,
                'meets_level' => $meetsLevel,
                'can_unlock' => $canUnlock,
                'unlocked_at' => $isUnlocked ? $user->researches->find($research->id)->pivot->unlocked_at : null,
            ];
        });
        
        return response()->json([
            'items' => $researches,
            'company_level' => $companyLevel,
        ]);
    }

    public function unlock(Request $request, $id)
    {
        $user = $request->user();
        $company = $user->company;
        
        $research = Research::findOrFail($id);
        
        // Check if already unlocked
        if ($user->researches()->where('researches.id', $research->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Research already unlocked',
            ], 400);
        }
        
        // Check company level
        $companyLevel = $company ? $company->company_level : 1;
        if ($companyLevel < $research->required_level) {
            return response()->json([
                'success' => false,
                'message' => "Requires Company Level {$research->required_level}",
            ], 403);
        }
        
        // Check COMPANY cash, not gameState money
        if ($company->cash < $research->cost) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough money',
            ], 403);
        }
        
        // Deduct money from COMPANY cash
        $company->cash -= $research->cost;
        $company->save();
        
        // Unlock research
        $user->researches()->attach($research->id, [
            'unlocked_at' => now(),
        ]);
        
        return response()->json([
            'success' => true,
            'message' => "Research '{$research->name}' unlocked!",
            'research' => $research,
            'company' => $company,
        ]);
    }
}

