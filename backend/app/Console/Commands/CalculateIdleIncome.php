<?php

namespace App\Console\Commands;

use App\Models\GameState;
use Illuminate\Console\Command;

class CalculateIdleIncome extends Command
{
    protected $signature = 'game:calculate-idle-income';
    protected $description = 'Calculate and apply idle income for all active game states';

    public function handle()
    {
        $gameStates = GameState::where('auto_income', '>', 0)->get();

        foreach ($gameStates as $gameState) {
            // Add 1 minute worth of income (60 seconds)
            $income = $gameState->auto_income * 60;
            
            $gameState->money += $income;
            $gameState->save();
            
            $this->info("User #{$gameState->user_id}: +${$income}");
        }

        $this->info("Processed {$gameStates->count()} game states");
        
        return Command::SUCCESS;
    }
}

