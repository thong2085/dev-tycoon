<?php

namespace App\Http\Controllers;

use App\Models\GameState;
use App\Models\Leaderboard;
use App\Models\MarketEvent;
use App\Models\NPCQuest;
use App\Models\Project;
use App\Models\Achievement;
use App\Models\Employee;
use App\Models\Product;
use App\Models\ProductBug;
use App\Events\PlayerPrestiged;
use App\Events\LeaderboardUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameController extends Controller
{
    public function getGameState(Request $request)
    {
        $user = $request->user();
        $gameState = $user->gameState()->with('company')->first();

        if (!$gameState) {
            return response()->json(['error' => 'Game state not found'], 404);
        }

        $company = $gameState->company;

        // Calculate offline income - add to COMPANY cash, not gameState money
        $offlineIncome = $gameState->calculateOfflineIncome();
        
        if ($offlineIncome > 0 && $company) {
            $company->cash += $offlineIncome;
            $company->save();
            $gameState->last_active = now();
            $gameState->save();
        }

        // Get active market events
        $activeEvents = MarketEvent::getActiveEvents();

        // Get skill bonuses
        $skillPassiveIncome = $user->getSkillPassiveIncome();
        $skillClickBonus = $user->getSkillClickPowerBonus();
        $totalSkillLevels = $user->getTotalSkillLevels();
        $maxedSkills = $user->getMaxedSkillsCount();

        // Update auto_income to include skill passive income
        $effectiveAutoIncome = $gameState->auto_income + $skillPassiveIncome;

        // Get projects and quests approaching deadline (within 24 hours)
        $approachingDeadlineProjects = $user->projects()
            ->whereIn('status', ['queued', 'in_progress'])
            ->whereNotNull('deadline')
            ->where('deadline', '>', now())
            ->where('deadline', '<=', now()->addHours(24))
            ->select('id', 'title', 'deadline', 'status', 'progress')
            ->get();

        $approachingExpiryQuests = NPCQuest::where('user_id', $user->id)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '>', now())
            ->where('expires_at', '<=', now()->addHours(24))
            ->select('id', 'title', 'expires_at', 'quest_type', 'current_progress', 'target_progress')
            ->get();

        // Get notification counts
        $notificationCounts = [
            'projects' => 0,
            'achievements' => 0,
            'employees' => 0,
            'products' => 0,
        ];
        
        // 1. PROJECTS: Count completed projects (ready to claim)
        $notificationCounts['projects'] = Project::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();
        
        // 2. ACHIEVEMENTS: Count unlocked but not viewed achievements
        $notificationCounts['achievements'] = $user->achievements()
            ->wherePivot('unlocked_at', '>=', now()->subHours(24))
            ->count();
        
        // 3. EMPLOYEES: Count employees needing rest (low energy OR low morale)
        if ($company) {
            $notificationCounts['employees'] = Employee::where('company_id', $company->id)
                ->where(function ($query) {
                    $query->where('energy', '<', 30)
                          ->orWhere('morale', '<', 30);
                })
                ->count();
        }
        
        // 4. PRODUCTS: Count active bugs on products
        $notificationCounts['products'] = ProductBug::whereHas('product', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('status', 'active')
            ->count();

        // Get active quests
        $activeQuests = NPCQuest::where('user_id', $user->id)
            ->where('status', 'active')
            ->with('npc:id,name,role,icon')
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate XP for current level (0-99)
        // Ensure level is at least 1
        if ($gameState->level < 1) {
            $gameState->level = 1;
        }
        
        $xpPerLevel = 100;
        $requiredXpForCurrentLevel = ($gameState->level - 1) * $xpPerLevel;
        $xpForCurrentLevel = max(0, $gameState->xp - $requiredXpForCurrentLevel);

        return response()->json([
            'success' => true,
            'data' => $gameState,
            'xp_current' => $xpForCurrentLevel, // XP for current level (0-99)
            'xp_for_next_level' => $xpPerLevel, // XP needed for next level (always 100)
            'offline_income' => $offlineIncome,
            'active_events' => $activeEvents,
            'company' => $company,
            'skill_bonuses' => [
                'passive_income' => $skillPassiveIncome,
                'click_power_bonus' => $skillClickBonus,
                'total_skill_levels' => $totalSkillLevels,
                'maxed_skills' => $maxedSkills,
                'effective_auto_income' => $effectiveAutoIncome,
            ],
            'approaching_deadlines' => [
                'projects' => $approachingDeadlineProjects,
                'quests' => $approachingExpiryQuests,
            ],
            'notification_counts' => $notificationCounts,
            'active_quests' => $activeQuests,
        ]);
    }

    public function click(Request $request)
    {
        $user = $request->user();
        $gameState = $user->gameState;
        $company = $gameState?->company;

        if (!$gameState || !$company) {
            return response()->json(['error' => 'Game state or company not found'], 404);
        }

        // Calculate click power with skill bonus
        $skillClickBonus = $user->getSkillClickPowerBonus();
        $baseClickPower = $gameState->click_power;
        $finalClickPower = $baseClickPower * (1 + $skillClickBonus);
        
        // Add click power to COMPANY cash, not gameState money
        $earnedMoney = $finalClickPower;
        $company->cash += $earnedMoney;
        $company->save();
        
        $gameState->lifetime_earnings += $earnedMoney;
        $gameState->total_clicks += 1;
        $gameState->xp += 1; // Earn 1 XP per click
        $gameState->last_active = now();

        // Level up logic: every 100 XP = 1 level
        // Ensure level starts at minimum 1
        if ($gameState->level < 1) {
            $gameState->level = 1;
        }
        
        $xpPerLevel = 100;
        // Calculate required XP for current level: (level - 1) * 100
        // XP needed for next level: level * 100
        // Example: Level 1 needs 0-99 XP, Level 2 needs 100-199 XP, etc.
        $requiredXpForNextLevel = $gameState->level * $xpPerLevel;
        
        // Check if we have enough XP to level up (handle multiple level ups at once)
        while ($gameState->xp >= $requiredXpForNextLevel && $gameState->xp > 0) {
            $gameState->level += 1;
            $gameState->click_power *= 1.1; // 10% boost per level
            $requiredXpForNextLevel = $gameState->level * $xpPerLevel;
        }

        $gameState->save();

        // Update leaderboard
        $this->updateLeaderboard($user->id, $gameState, $company);

        // Calculate XP for current level (0-99)
        // Ensure level is at least 1
        if ($gameState->level < 1) {
            $gameState->level = 1;
        }
        
        $xpPerLevel = 100;
        $requiredXpForCurrentLevel = ($gameState->level - 1) * $xpPerLevel;
        $xpForCurrentLevel = max(0, $gameState->xp - $requiredXpForCurrentLevel);
        $xpForNextLevel = $gameState->level * $xpPerLevel;

        return response()->json([
            'money' => $company->cash,
            'click_power' => $gameState->click_power,
            'effective_click_power' => $finalClickPower,
            'skill_bonus' => $skillClickBonus,
            'xp' => $gameState->xp, // Total XP (cumulative)
            'xp_current' => max(0, $xpForCurrentLevel), // XP for current level (0-99)
            'xp_for_next_level' => $xpPerLevel, // XP needed for next level (always 100)
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
        $company = $gameState?->company;

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $upgradeType = $request->upgrade_type;
        $upgrades = $gameState->upgrades ?? [];

        // Get current level of this upgrade
        $currentLevel = $upgrades[$upgradeType] ?? 0;
        $nextLevel = $currentLevel + 1;

        // Calculate cost (exponential growth)
        $baseCost = $this->getUpgradeBaseCost($upgradeType);
        $cost = $baseCost * pow(1.15, $currentLevel);

        // Check COMPANY cash, not gameState money
        if ($company->cash < $cost) {
            return response()->json(['error' => 'Not enough money'], 400);
        }

        // Deduct money from COMPANY cash
        $company->cash -= $cost;
        $company->save();

        // Apply upgrade effect
        $this->applyUpgradeEffect($gameState, $upgradeType, $nextLevel);

        // Save upgrade level
        $upgrades[$upgradeType] = $nextLevel;
        $gameState->upgrades = $upgrades;
        $gameState->save();

        return response()->json([
            'success' => true,
            'data' => $gameState,
            'company' => $company,
            'cost' => $cost,
            'upgrade_level' => $nextLevel,
        ]);
    }

    public function prestige(Request $request)
    {
        $user = $request->user();
        $gameState = $user->gameState;
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        // Check if eligible for prestige (level 50+ and $1M+ COMPANY cash)
        if ($gameState->level < 50 || $company->cash < 1000000) {
            return response()->json([
                'error' => 'Not eligible for prestige yet',
                'requirements' => [
                    'level' => 50,
                    'money' => 1000000,
                ],
                'current' => [
                    'level' => $gameState->level,
                    'money' => $company->cash,
                ],
            ], 400);
        }

        // Calculate prestige points based on progress
        $prestigePoints = floor($gameState->level / 10) + floor($company->cash / 1000000);
        $achievementsCount = $user->achievements()->count();
        $prestigePoints += floor($achievementsCount / 5); // Bonus for achievements

        // Save old stats
        $oldLevel = $gameState->level;
        $oldMoney = $company->cash;

        // Increase prestige level and points
        $gameState->prestige_level += 1;
        $gameState->prestige_points += $prestigePoints;

        // Reset game state but keep prestige bonuses
        $gameState->click_power = 1 * (1 + ($gameState->prestige_points * 0.1)); // +10% per prestige point
        $gameState->auto_income = 0;
        $gameState->xp = 0;
        $gameState->level = 1;
        $gameState->reputation = 0;
        $gameState->completed_projects = 0;
        $gameState->total_clicks = 0;
        $gameState->upgrades = [];
        $gameState->save();

        // Keep skills, achievements, and prestige level
        // Delete projects, employees, and products
        $user->projects()->delete();
        if ($company) {
            $company->employees()->delete();
            $company->products()->delete(); // Delete all products
        }
        
        // Reset company cash
        $company->cash = 100;
        $company->monthly_revenue = 0;
        $company->monthly_costs = 0;
        $company->save();

        // Broadcast prestige event
        broadcast(new PlayerPrestiged($user, $gameState->prestige_level, $prestigePoints));

        // Update leaderboard broadcast
        broadcast(new LeaderboardUpdated('money'));

        return response()->json([
            'success' => true,
            'message' => "Prestige Level {$gameState->prestige_level}! Earned {$prestigePoints} prestige points!",
            'prestige_level' => $gameState->prestige_level,
            'prestige_points' => $gameState->prestige_points,
            'points_gained' => $prestigePoints,
            'old_stats' => [
                'level' => $oldLevel,
                'money' => $oldMoney,
            ],
            'data' => $gameState,
        ]);
    }

    public function leaderboard(Request $request)
    {
        $category = $request->get('category', 'money'); // money, level, reputation, projects
        $currentUserId = $request->user()->id;

        // Get top 100 by category
        $orderColumn = match($category) {
            'level' => 'level',
            'reputation' => 'reputation',
            'projects' => 'projects_completed',
            default => 'money',
        };

        $leaderboard = Leaderboard::with('user:id,name')
            ->orderBy($orderColumn, 'desc')
            ->limit(100)
            ->get()
            ->map(function ($entry, $index) use ($currentUserId, $category) {
                return [
                    'rank' => $index + 1,
                    'user_id' => $entry->user_id,
                    'name' => $entry->user->name ?? 'Unknown',
                    'money' => $entry->money,
                    'level' => $entry->level,
                    'reputation' => $entry->reputation,
                    'projects_completed' => $entry->projects_completed,
                    'is_current_user' => $entry->user_id === $currentUserId,
                ];
            });

        // Find current user's rank if not in top 100
        $currentUserEntry = Leaderboard::where('user_id', $currentUserId)->first();
        $currentUserRank = null;
        
        if ($currentUserEntry && !$leaderboard->where('is_current_user', true)->first()) {
            // Calculate rank
            $higherRanked = Leaderboard::where($orderColumn, '>', $currentUserEntry->$orderColumn)->count();
            $currentUserRank = [
                'rank' => $higherRanked + 1,
                'user_id' => $currentUserEntry->user_id,
                'name' => $request->user()->name,
                'money' => $currentUserEntry->money,
                'level' => $currentUserEntry->level,
                'reputation' => $currentUserEntry->reputation,
                'projects_completed' => $currentUserEntry->projects_completed,
                'is_current_user' => true,
            ];
        }

        return response()->json([
            'success' => true,
            'category' => $category,
            'leaderboard' => $leaderboard,
            'current_user_rank' => $currentUserRank,
        ]);
    }

    private function updateLeaderboard($userId, $gameState, $company = null)
    {
        Leaderboard::updateEntry($userId, $gameState, $company);
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
                $gameState->setAttribute('click_power', (float)$gameState->click_power + 1.0);
                break;
            case 'auto_income':
                $gameState->setAttribute('auto_income', (float)$gameState->auto_income + 0.5);
                break;
            // Add more upgrade types as needed
        }
    }
    
    public function scheduleTrigger(Request $request)
    {
        try {
            // Security check (optional - can be disabled if no secret set)
            $secret = env('SCHEDULE_SECRET');
            if (!empty($secret) && $request->header('X-Schedule-Secret') !== $secret) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            
            // Check if proc_open is available (shared hosting often disables it)
            if (!function_exists('proc_open')) {
                // Fallback: Run scheduled commands directly using Artisan::call()
                $executed = [];
                $errors = [];
                
                // Run commands that should execute every minute (most game commands)
                $minuteCommands = [
                    'game:calculate-idle-income',
                    'game:process-projects',
                    'game:update-employees-state',
                    'game:update-company-level',
                    'game:pay-salaries',
                    'game:process-products',
                    'game:process-automation',
                    'game:complete-bug-fixes',
                    'game:check-deadlines',
                ];
                
                // Run game:increment-day based on config (check if due)
                $minutesPerDay = config('game_balance.time.minutes_per_game_day', 5);
                $lastIncrement = cache()->get('last_day_increment');
                $now = now()->timestamp;
                
                if (!$lastIncrement || ($now - $lastIncrement) >= ($minutesPerDay * 60)) {
                    $minuteCommands[] = 'game:increment-day';
                    cache()->put('last_day_increment', $now, now()->addMinutes($minutesPerDay));
                }
                
                // Run every 3 minutes commands (check cache)
                $lastBugSpawn = cache()->get('last_bug_spawn');
                if (!$lastBugSpawn || ($now - $lastBugSpawn) >= 180) {
                    $minuteCommands[] = 'game:spawn-product-bugs';
                    cache()->put('last_bug_spawn', $now, now()->addMinutes(3));
                }
                
                // Run every 5 minutes commands
                $lastMarketEvent = cache()->get('last_market_event');
                if (!$lastMarketEvent || ($now - $lastMarketEvent) >= 300) {
                    $minuteCommands[] = 'game:trigger-market-event';
                    cache()->put('last_market_event', $now, now()->addMinutes(5));
                }
                
                $lastBankruptcy = cache()->get('last_bankruptcy_check');
                if (!$lastBankruptcy || ($now - $lastBankruptcy) >= 300) {
                    $minuteCommands[] = 'game:check-bankruptcy';
                    cache()->put('last_bankruptcy_check', $now, now()->addMinutes(5));
                }
                
                // Run every 30 minutes commands
                $lastStarterProjects = cache()->get('last_starter_projects');
                if (!$lastStarterProjects || ($now - $lastStarterProjects) >= 1800) {
                    $minuteCommands[] = 'game:spawn-starter-projects';
                    cache()->put('last_starter_projects', $now, now()->addMinutes(30));
                }
                
                // Execute all due commands
                foreach ($minuteCommands as $command) {
                    try {
                        \Illuminate\Support\Facades\Artisan::call($command);
                        $executed[] = $command;
                    } catch (\Exception $e) {
                        $errors[$command] = $e->getMessage();
                        Log::warning("Scheduled command '$command' failed: " . $e->getMessage());
                    }
                }
                
                return response()->json([
                    'success' => true,
                    'message' => 'Schedule executed (proc_open fallback)',
                    'executed' => $executed,
                    'executed_count' => count($executed),
                    'errors' => $errors
                ]);
            }
            
            // Normal execution if proc_open is available
            \Illuminate\Support\Facades\Artisan::call('schedule:run');
            $output = \Illuminate\Support\Facades\Artisan::output();
            
            return response()->json([
                'success' => true, 
                'message' => 'Schedule executed',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            // Log error but don't expose sensitive info
            Log::error('Schedule trigger error: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Schedule execution failed',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}

