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
        $gameStates = GameState::where('auto_income', '>', 0)->with(['user', 'company'])->get();

        foreach ($gameStates as $gameState) {
            $user = $gameState->user;
            $company = $gameState->company;
            
            if (!$company) {
                continue; // Skip if no company
            }
            
            // Add 1 minute worth of income (60 seconds) + skill passive income
            $baseIncome = $gameState->auto_income * 60;
            $skillPassiveIncome = $user ? $user->getSkillPassiveIncome() * 60 : 0;
            $totalIncome = $baseIncome + $skillPassiveIncome;
            
            // Add to COMPANY cash, not gameState money
            $company->cash += $totalIncome;
            $company->save();
            
            $this->info("User #{$gameState->user_id}: +\$" . number_format($totalIncome, 2) . " (base: \$" . number_format($baseIncome, 2) . ", skills: \$" . number_format($skillPassiveIncome, 2));
        }

        $this->info("Processed {$gameStates->count()} game states");
        
        return Command::SUCCESS;
    }
}

