<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Events\AchievementUnlocked;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    /**
     * Get all achievements with user's progress
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $achievements = Achievement::orderBy('category')->orderBy('order')->get();

        $data = $achievements->map(function ($achievement) use ($user) {
            $isUnlocked = $achievement->isUnlockedBy($user);
            $progress = $isUnlocked ? 100 : $achievement->getProgressFor($user);

            return [
                'id' => $achievement->id,
                'key' => $achievement->key,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'icon' => $achievement->icon,
                'category' => $achievement->category,
                'requirement_value' => $achievement->requirement_value,
                'requirement_type' => $achievement->requirement_type,
                'reward_money' => $achievement->reward_money,
                'reward_xp' => $achievement->reward_xp,
                'reward_prestige_points' => $achievement->reward_prestige_points,
                'is_unlocked' => $isUnlocked,
                'progress' => round($progress, 2),
                'unlocked_at' => $isUnlocked ? $achievement->users()->where('user_id', $user->id)->first()->pivot->unlocked_at : null,
            ];
        });

        // Group by category
        $grouped = $data->groupBy('category');

        return response()->json([
            'success' => true,
            'achievements' => $data,
            'grouped' => $grouped,
            'stats' => [
                'total' => $achievements->count(),
                'unlocked' => $data->where('is_unlocked', true)->count(),
                'completion_percentage' => $achievements->count() > 0 
                    ? round(($data->where('is_unlocked', true)->count() / $achievements->count()) * 100, 2)
                    : 0,
            ],
        ]);
    }

    /**
     * Check and unlock achievements for a user
     */
    public function checkAchievements(Request $request)
    {
        $user = $request->user();
        $achievements = Achievement::all();
        $newlyUnlocked = [];

        foreach ($achievements as $achievement) {
            if (!$achievement->isUnlockedBy($user) && $achievement->getProgressFor($user) >= 100) {
                // Unlock achievement
                $user->achievements()->attach($achievement->id, [
                    'unlocked_at' => now(),
                    'notified' => false,
                ]);

                // Grant rewards
                $company = $user->company;
                $gameState = $user->gameState;
                
                // Add reward money to COMPANY cash
                if ($company) {
                    $company->cash += $achievement->reward_money;
                    $company->save();
                }
                
                $gameState->xp += $achievement->reward_xp;
                $gameState->prestige_points += $achievement->reward_prestige_points;
                $gameState->save();

                // Broadcast achievement unlock
                broadcast(new AchievementUnlocked($user, $achievement));

                $newlyUnlocked[] = [
                    'achievement' => $achievement,
                    'rewards' => [
                        'money' => $achievement->reward_money,
                        'xp' => $achievement->reward_xp,
                        'prestige_points' => $achievement->reward_prestige_points,
                    ],
                ];
            }
        }

        return response()->json([
            'success' => true,
            'newly_unlocked' => $newlyUnlocked,
            'count' => count($newlyUnlocked),
        ]);
    }

    /**
     * Get unnotified achievements
     */
    public function getUnnotified(Request $request)
    {
        $user = $request->user();
        
        $unnotified = $user->achievements()
            ->wherePivot('notified', false)
            ->get()
            ->map(function ($achievement) {
                return [
                    'id' => $achievement->id,
                    'name' => $achievement->name,
                    'description' => $achievement->description,
                    'icon' => $achievement->icon,
                    'rewards' => [
                        'money' => $achievement->reward_money,
                        'xp' => $achievement->reward_xp,
                        'prestige_points' => $achievement->reward_prestige_points,
                    ],
                ];
            });

        // Mark as notified
        $user->achievements()->updateExistingPivot(
            $unnotified->pluck('id')->toArray(),
            ['notified' => true]
        );

        return response()->json([
            'success' => true,
            'achievements' => $unnotified,
        ]);
    }
}

