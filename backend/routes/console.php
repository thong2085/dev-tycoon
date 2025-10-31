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

// Trigger random market events
Schedule::command('game:trigger-market-event')->everyFiveMinutes();

