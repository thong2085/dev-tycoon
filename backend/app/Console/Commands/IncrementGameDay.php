<?php

namespace App\Console\Commands;

use App\Models\GameState;
use Illuminate\Console\Command;

class IncrementGameDay extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'game:increment-day';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Increment game day for all players (based on config: minutes_per_game_day)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $minutesPerDay = config('game_balance.time.minutes_per_game_day', 5);
        
        // Get all game states that should increment day
        // Only increment if enough time has passed since last increment
        // We'll track this by checking if enough real minutes have passed
        // For simplicity, we increment every time this command runs (scheduled every minute)
        // But the schedule interval should match minutes_per_game_day
        
        $this->info("Incrementing game day for all players (every {$minutesPerDay} real minutes = 1 game day)...");
        
        $count = GameState::whereNotNull('user_id')->increment('current_day');
        
        $this->info("Game day incremented for {$count} players.");
        
        return 0;
    }
}
