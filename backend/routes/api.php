<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\AchievementController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\MarketingCampaignController;
use App\Http\Controllers\ResearchController;
use App\Http\Controllers\AutomationController;
use App\Http\Controllers\ProductBugController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\NPCController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Schedule trigger for external cron (shared hosting)
Route::get('/schedule-trigger', function(\Illuminate\Http\Request $request) {
    try {
        // Security check (optional - can be disabled if no secret set)
        $secret = env('SCHEDULE_SECRET');
        if (!empty($secret) && $request->header('X-Schedule-Secret') !== $secret) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        // Check if proc_open is available (shared hosting often disables it)
        if (!function_exists('proc_open')) {
            // Fallback: Run scheduled commands directly using Artisan::call()
            // This bypasses the Process class that requires proc_open
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
});

// Test route to verify API is working
Route::get('/test', function() {
    return response()->json(['status' => 'ok', 'message' => 'API is working']);
});

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    
    // Game State (higher rate limit for frequent polling)
    Route::middleware('throttle:api-general')->group(function () {
        Route::get('/game', [GameController::class, 'getGameState']);
    });
    
    // Game Actions (highest rate limit for click/upgrade)
    Route::middleware('throttle:game')->group(function () {
        Route::post('/game/click', [GameController::class, 'click']);
        Route::post('/game/upgrade', [GameController::class, 'buyUpgrade']);
        Route::post('/game/prestige', [GameController::class, 'prestige']);
    });
    
    // Company
    Route::middleware('throttle:api-general')->group(function () {
        Route::get('/company', [CompanyController::class, 'show']);
    });
    Route::post('/company', [CompanyController::class, 'create']);
    Route::put('/company', [CompanyController::class, 'update']);
    
    // Projects (higher rate limit for frequent polling)
    Route::middleware('throttle:api-general')->group(function () {
        Route::get('/projects', [ProjectController::class, 'index']);
        Route::get('/projects/available', [ProjectController::class, 'availableJobs']);
        Route::get('/projects/{id}', [ProjectController::class, 'show']);
    });
    Route::post('/projects/{id}/accept', [ProjectController::class, 'acceptJob']);
    Route::post('/projects/start', [ProjectController::class, 'start']);
    Route::post('/projects/{id}/claim', [ProjectController::class, 'claim']);
    
    // Employees (higher rate limit for frequent polling)
    Route::middleware('throttle:api-general')->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index']);
    });
    Route::post('/employees/hire', [EmployeeController::class, 'hire']);
    Route::post('/employees/{id}/fire', [EmployeeController::class, 'fire']);
    Route::post('/employees/{id}/assign', [EmployeeController::class, 'assignTask']);
    Route::post('/employees/{id}/assign-project', [EmployeeController::class, 'assignToProject']);
    Route::post('/employees/{id}/unassign', [EmployeeController::class, 'unassignFromProject']);
    Route::post('/employees/{id}/rest', [EmployeeController::class, 'rest']);
    
    // Skills
    Route::get('/skills', [SkillController::class, 'index']);
    Route::get('/user/skills', [SkillController::class, 'userSkills']);
    Route::post('/skills/unlock', [SkillController::class, 'unlock']);
    Route::post('/skills/upgrade', [SkillController::class, 'upgrade']);
    
    // Leaderboard
    Route::get('/leaderboard', [GameController::class, 'leaderboard']);
    
    // Achievements
    Route::get('/achievements', [AchievementController::class, 'index']);
    Route::post('/achievements/check', [AchievementController::class, 'checkAchievements']);
    Route::get('/achievements/unnotified', [AchievementController::class, 'getUnnotified']);
    
    // Notifications (higher rate limit for frequent polling)
    Route::middleware('throttle:api-general')->group(function () {
        Route::get('/notifications/counts', [NotificationController::class, 'getCounts']);
        Route::get('/notifications', [NotificationController::class, 'getNotifications']);
    });
    
    // Shop
    Route::get('/shop', [ShopController::class, 'index']);
    Route::post('/shop/purchase', [ShopController::class, 'purchase']);
    Route::get('/shop/purchases', [ShopController::class, 'getActivePurchases']);

    // Products (higher rate limit for frequent polling)
    Route::middleware('throttle:api-general')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
    });
    Route::post('/products/launch-from-project/{projectId}', [ProductController::class, 'launchFromProject']);
    Route::post('/products/{id}/pause', [ProductController::class, 'pause']);
    Route::post('/products/{id}/resume', [ProductController::class, 'resume']);
    Route::delete('/products/{id}', [ProductController::class, 'retire']);

    // Marketing campaigns
    Route::get('/products/{productId}/campaigns', [MarketingCampaignController::class, 'index']);
    Route::post('/products/{productId}/campaigns', [MarketingCampaignController::class, 'launch']);
    
    // Product Bugs
    Route::get('/products/{productId}/bugs', [ProductBugController::class, 'index']);
    Route::post('/bugs/{bugId}/start-fix', [ProductBugController::class, 'startFix']);
    Route::post('/bugs/{bugId}/complete-fix', [ProductBugController::class, 'completeFix']);
    
    // Research Tree
    Route::get('/research', [ResearchController::class, 'index']);
    Route::post('/research/{id}/unlock', [ResearchController::class, 'unlock']);
    
    // Automation Settings
    Route::get('/automation', [AutomationController::class, 'getSettings']);
    Route::put('/automation', [AutomationController::class, 'updateSettings']);
    
    // AI Generation
    Route::prefix('ai')->group(function () {
        Route::get('/test', [AIController::class, 'testConnection']);
        
        // Projects
        Route::post('/generate/projects', [AIController::class, 'generateProjects']);
        Route::post('/create/project', [AIController::class, 'createProject']);
        
        // Skills
        Route::post('/generate/skills', [AIController::class, 'generateSkills']);
        Route::post('/create/skill', [AIController::class, 'createSkill']);
        
        // Achievements
        Route::post('/generate/achievements', [AIController::class, 'generateAchievements']);
        Route::post('/create/achievement', [AIController::class, 'createAchievement']);
        
        // Employee & Company Names
        Route::post('/generate/employee-names', [AIController::class, 'generateEmployeeNames']);
        Route::post('/generate/company-names', [AIController::class, 'generateCompanyNames']);
    });
    
    // AI Mentor Chat
    Route::get('/chat', [ChatController::class, 'index']);
    Route::post('/chat', [ChatController::class, 'sendMessage']);
    Route::delete('/chat', [ChatController::class, 'clear']);
    
    // NPCs
    Route::get('/npcs', [NPCController::class, 'index']);
    Route::get('/npcs/{npcId}/conversation', [NPCController::class, 'getConversation']);
    Route::post('/npcs/{npcId}/conversation', [NPCController::class, 'sendMessage']);
    Route::delete('/npcs/{npcId}/conversation', [NPCController::class, 'clearConversation']);
    
    // NPC Quests (higher rate limit for frequent polling)
    Route::middleware('throttle:api-general')->group(function () {
        Route::get('/npcs/quests/active', [NPCController::class, 'getActiveQuests']);
    });
    
    Route::post('/npcs/{npcId}/request-quest', [NPCController::class, 'requestQuest']);
    Route::post('/npcs/quests/{questId}/fix', [NPCController::class, 'fixQuest']);
    Route::delete('/npcs/quests/{questId}', [NPCController::class, 'rejectQuest']);
    Route::post('/npcs/quests/{questId}/complete', [NPCController::class, 'completeQuest']);
});

