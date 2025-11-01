<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Removed inspire command - hourly() method doesn't exist for Artisan commands
// Artisan::command('inspire', function () {
//     $this->comment(Inspiring::quote());
// })->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Schedule Jobs
|--------------------------------------------------------------------------
|
| Here you can schedule jobs for the game mechanics
|
*/

// Spawn starter projects for low-level players (runs every 30 minutes)
Schedule::command('game:spawn-starter-projects')->everyThirtyMinutes();

// Increment game day based on config (default: every 5 minutes = 1 game day)
$minutesPerDay = config('game_balance.time.minutes_per_game_day', 5);
if ($minutesPerDay === 1) {
    Schedule::command('game:increment-day')->everyMinute();
} elseif ($minutesPerDay === 2) {
    Schedule::command('game:increment-day')->everyTwoMinutes();
} elseif ($minutesPerDay === 3) {
    Schedule::command('game:increment-day')->everyThreeMinutes();
} elseif ($minutesPerDay === 5) {
    Schedule::command('game:increment-day')->everyFiveMinutes();
} elseif ($minutesPerDay === 10) {
    Schedule::command('game:increment-day')->everyTenMinutes();
} elseif ($minutesPerDay === 15) {
    Schedule::command('game:increment-day')->everyFifteenMinutes();
} elseif ($minutesPerDay === 30) {
    Schedule::command('game:increment-day')->everyThirtyMinutes();
} else {
    // For custom intervals, use cron expression
    Schedule::command('game:increment-day')->cron("*/{$minutesPerDay} * * * *");
}

// Calculate idle income every minute
Schedule::command('game:calculate-idle-income')->everyMinute();

// Process project progress every minute
Schedule::command('game:process-projects')->everyMinute();

// Update employee states (energy & morale) every minute
Schedule::command('game:update-employees-state')->everyMinute();

// Recalculate company level every minute
Schedule::command('game:update-company-level')->everyMinute();

// Pay employee salaries every minute (1 minute = 1 day in-game)
Schedule::command('game:pay-salaries')->everyMinute();

// Accrue product revenue every minute
Schedule::command('game:process-products')->everyMinute();

// Process automation (auto rest, auto assign) every minute
Schedule::command('game:process-automation')->everyMinute();

// Spawn product bugs randomly (every 3 minutes)
Schedule::command('game:spawn-product-bugs')->everyThreeMinutes();

// Complete bug fixes that have reached their fix time (every minute)
Schedule::command('game:complete-bug-fixes')->everyMinute();

// Trigger random market events
Schedule::command('game:trigger-market-event')->everyFiveMinutes();

// Check for bankrupt companies (every 5 minutes)
Schedule::command('game:check-bankruptcy')->everyFiveMinutes();

// Check overdue projects and expired quests (every minute)
Schedule::command('game:check-deadlines')->everyMinute();

