<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

/*
|--------------------------------------------------------------------------
| Schedule Jobs
|--------------------------------------------------------------------------
|
| Here you can schedule jobs for the game mechanics
|
*/

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

// Trigger random market events
Schedule::command('game:trigger-market-event')->everyFiveMinutes();

