<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\SkillController;

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
    Route::post('/projects/start', [ProjectController::class, 'start']);
    Route::post('/projects/{id}/claim', [ProjectController::class, 'claim']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    
    // Employees
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees/hire', [EmployeeController::class, 'hire']);
    Route::post('/employees/{id}/fire', [EmployeeController::class, 'fire']);
    Route::post('/employees/{id}/assign', [EmployeeController::class, 'assignTask']);
    
    // Skills
    Route::get('/skills', [SkillController::class, 'index']);
    Route::get('/user/skills', [SkillController::class, 'userSkills']);
    Route::post('/skills/unlock', [SkillController::class, 'unlock']);
    Route::post('/skills/upgrade', [SkillController::class, 'upgrade']);
    
    // Leaderboard
    Route::get('/leaderboard', [GameController::class, 'leaderboard']);
});

