<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
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

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    
    // Game State
    Route::get('/game', [GameController::class, 'getGameState']);
    Route::post('/game/click', [GameController::class, 'click']);
    Route::post('/game/upgrade', [GameController::class, 'buyUpgrade']);
    Route::post('/game/prestige', [GameController::class, 'prestige']);
    
    // Company
    Route::get('/company', [CompanyController::class, 'show']);
    Route::post('/company', [CompanyController::class, 'create']);
    Route::put('/company', [CompanyController::class, 'update']);
    
    // Projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/available', [ProjectController::class, 'availableJobs']);
    Route::post('/projects/{id}/accept', [ProjectController::class, 'acceptJob']);
    Route::post('/projects/start', [ProjectController::class, 'start']);
    Route::post('/projects/{id}/claim', [ProjectController::class, 'claim']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    
    // Employees
    Route::get('/employees', [EmployeeController::class, 'index']);
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
    
    // Notifications
    Route::get('/notifications/counts', [NotificationController::class, 'getCounts']);
    Route::get('/notifications', [NotificationController::class, 'getNotifications']);
    
    // Shop
    Route::get('/shop', [ShopController::class, 'index']);
    Route::post('/shop/purchase', [ShopController::class, 'purchase']);
    Route::get('/shop/purchases', [ShopController::class, 'getActivePurchases']);

    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
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
});

