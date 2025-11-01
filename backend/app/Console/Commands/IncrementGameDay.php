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
    protected $description = 'Increment game day for all players (1 real minute = 1 game day)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Incrementing game day for all players...');
        
        $count = GameState::whereNotNull('user_id')->increment('current_day');
        
        $this->info("Game day incremented for {$count} players.");
        
        return 0;
    }
}
