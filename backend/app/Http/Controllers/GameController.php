<?php

namespace App\Http\Controllers;

use App\Models\GameState;
use App\Models\Leaderboard;
use App\Models\MarketEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    public function getGameState(Request $request)
    {
        $user = $request->user();
        $gameState = $user->gameState()->with('company')->first();

        if (!$gameState) {
            return response()->json(['error' => 'Game state not found'], 404);
        }

        // Calculate offline income
        $offlineIncome = $gameState->calculateOfflineIncome();
        
        if ($offlineIncome > 0) {
            $gameState->money += $offlineIncome;
            $gameState->last_active = now();
            $gameState->save();
        }

        // Get active market events
        $activeEvents = MarketEvent::getActiveEvents();

        return response()->json([
            'game_state' => $gameState,
            'offline_income' => $offlineIncome,
            'active_events' => $activeEvents,
            'company' => $gameState->company,
        ]);
    }

    public function click(Request $request)
    {
        $user = $request->user();
        $gameState = $user->gameState;

        if (!$gameState) {
            return response()->json(['error' => 'Game state not found'], 404);
        }

        // Add click power to money
        $earnedMoney = $gameState->click_power;
        $gameState->money += $earnedMoney;
        $gameState->xp += 1; // Earn 1 XP per click
        $gameState->last_active = now();

        // Level up logic (simple: every 100 XP)
        $newLevel = floor($gameState->xp / 100) + 1;
        if ($newLevel > $gameState->level) {
            $gameState->level = $newLevel;
            $gameState->click_power *= 1.1; // 10% boost per level
        }

        $gameState->save();

        // Update leaderboard
        $this->updateLeaderboard($user->id, $gameState->money);

        return response()->json([
            'money' => $gameState->money,
            'click_power' => $gameState->click_power,
            'xp' => $gameState->xp,
            'level' => $gameState->level,
            'earned' => $earnedMoney,
        ]);
    }

    public function buyUpgrade(Request $request)
    {
        $request->validate([
            'upgrade_type' => 'required|string',
        ]);

        $user = $request->user();
        $gameState = $user->gameState;

        $upgradeType = $request->upgrade_type;
        $upgrades = $gameState->upgrades ?? [];

        // Get current level of this upgrade
        $currentLevel = $upgrades[$upgradeType] ?? 0;
        $nextLevel = $currentLevel + 1;

        // Calculate cost (exponential growth)
        $baseCost = $this->getUpgradeBaseCost($upgradeType);
        $cost = $baseCost * pow(1.15, $currentLevel);

        if ($gameState->money < $cost) {
            return response()->json(['error' => 'Not enough money'], 400);
        }

        // Deduct money
        $gameState->money -= $cost;

        // Apply upgrade effect
        $this->applyUpgradeEffect($gameState, $upgradeType, $nextLevel);

        // Save upgrade level
        $upgrades[$upgradeType] = $nextLevel;
        $gameState->upgrades = $upgrades;
        $gameState->save();

        return response()->json([
            'success' => true,
            'game_state' => $gameState,
            'cost' => $cost,
            'upgrade_level' => $nextLevel,
        ]);
    }

    public function prestige(Request $request)
    {
        $user = $request->user();
        $gameState = $user->gameState;

        // Check if eligible for prestige (e.g., reached level 50)
        if ($gameState->level < 50) {
            return response()->json(['error' => 'Not eligible for prestige yet'], 400);
        }

        // Calculate prestige points based on progress
        $prestigePoints = floor($gameState->level / 10);

        // Reset game state but keep prestige points
        $user->prestige_points += $prestigePoints;
        $user->level = 1;
        $user->save();

        $gameState->money = 100;
        $gameState->click_power = 1 + ($user->prestige_points * 0.1); // Bonus from prestige
        $gameState->auto_income = 0;
        $gameState->xp = 0;
        $gameState->level = 1;
        $gameState->upgrades = [];
        $gameState->save();

        return response()->json([
            'success' => true,
            'prestige_points' => $user->prestige_points,
            'game_state' => $gameState,
        ]);
    }

    public function leaderboard(Request $request)
    {
        $leaderboard = Leaderboard::with('user')
            ->orderBy('rank')
            ->limit(100)
            ->get();

        return response()->json($leaderboard);
    }

    private function updateLeaderboard($userId, $score)
    {
        Leaderboard::updateOrCreate(
            ['user_id' => $userId],
            ['score' => $score]
        );

        // Update rankings (could be done via queue for performance)
        Leaderboard::updateRankings();
    }

    private function getUpgradeBaseCost($upgradeType): float
    {
        return match($upgradeType) {
            'click_power' => 50,
            'auto_income' => 100,
            'employee_slot' => 500,
            'project_slot' => 1000,
            default => 100,
        };
    }

    private function applyUpgradeEffect(GameState $gameState, $upgradeType, $level)
    {
        switch($upgradeType) {
            case 'click_power':
                $gameState->click_power += 1;
                break;
            case 'auto_income':
                $gameState->auto_income += 0.5;
                break;
            // Add more upgrade types as needed
        }
    }
}

