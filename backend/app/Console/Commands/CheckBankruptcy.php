<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Employee;
use Illuminate\Console\Command;

class CheckBankruptcy extends Command
{
    protected $signature = 'game:check-bankruptcy';
    protected $description = 'Check for bankrupt companies and reset game state';

    // Bankruptcy threshold (negative cash)
    const BANKRUPTCY_THRESHOLD = -10000;

    public function handle()
    {
        $companies = Company::with(['employees', 'user'])->get();
        $bankruptedCount = 0;

        foreach ($companies as $company) {
            // Check if company is bankrupt (cash below threshold)
            if ($company->cash < self::BANKRUPTCY_THRESHOLD) {
                $employeeCount = $company->employees->count();
                $user = $company->user;
                
                if (!$user) {
                    continue; // Skip if no user
                }

                // Calculate financial loss (for event)
                $productCount = $company->products()->count();
                
                // RESET GAME STATE (Complete bankruptcy)
                $this->handleBankruptcy($user, $company);

                $this->warn("⚠️  Company '{$company->name}' declared BANKRUPTCY! Lost everything. Cash: \${$company->cash}");
                
                // Broadcast bankruptcy notification
                broadcast(new \App\Events\CompanyBankrupted($user->id, $company->name, $employeeCount, (float)$company->cash));

                $bankruptedCount++;
            }
        }

        if ($bankruptedCount > 0) {
            $this->error("💥 {$bankruptedCount} company(ies) went bankrupt!");
        } else {
            $this->info("✅ No bankruptcies detected. All companies are financially stable.");
        }
        
        return Command::SUCCESS;
    }

    protected function handleBankruptcy($user, $company): void
    {
        $gameState = $user->gameState;
        
        // Reset game state (bankruptcy - keep knowledge, lose assets)
        if ($gameState) {
            // Don't reset gameState.money anymore - we use company.cash now
            $gameState->click_power = 1;
            $gameState->auto_income = 0;
            $gameState->upgrades = []; // Lose upgrades
            // KEEP: level, xp, reputation, completed_projects, total_clicks (player progress)
            $gameState->save();
        }

        // Fire all employees
        $company->employees()->delete();
        
        // Delete all projects
        $user->projects()->delete();
        
        // Retire all products
        $company->products()->update(['active' => false]);
        
        // Reset company cash and stats
        $company->cash = 100; // Minimal starting capital
        $company->monthly_revenue = 0;
        $company->monthly_costs = 0;
        $company->company_level = 1;
        $company->save();
        
        // KEEP: User level, achievements, skills, researches (player knowledge retained)
    }
}

