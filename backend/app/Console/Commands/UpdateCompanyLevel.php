<?php

namespace App\Console\Commands;

use App\Models\Company;
use Illuminate\Console\Command;

class UpdateCompanyLevel extends Command
{
    protected $signature = 'game:update-company-level';
    protected $description = 'Recalculate company level based on progress (projects, earnings, team size)';

    public function handle()
    {
        $companies = Company::with(['user.gameState', 'employees', 'products'])->get();
        $leveledUpCount = 0;

        foreach ($companies as $company) {
            $user = $company->user;
            $gameState = $user?->gameState;

            $completedProjects = (int)($gameState?->completed_projects ?? 0);
            $lifetimeEarnings = (float)($gameState?->lifetime_earnings ?? 0);
            $teamSize = $company->employees->count();
            $productsCount = $company->products->count();

            // Simple transparent formula:
            // - Every 5 completed projects = +1 level
            // - Every $50k lifetime earnings = +1 level
            // - Every 3 employees = +1 level
            // - Every 2 products launched = +1 level
            $levelFromProjects = intdiv($completedProjects, 5);
            $levelFromEarnings = (int) floor($lifetimeEarnings / 50000);
            $levelFromTeam = intdiv($teamSize, 3);
            $levelFromProducts = intdiv(max(0, $productsCount), 2);

            $targetLevel = max(1, 1 + $levelFromProjects + $levelFromEarnings + $levelFromTeam + $levelFromProducts);

            if ($targetLevel > $company->company_level) {
                $old = $company->company_level;
                $company->company_level = $targetLevel;
                $company->save();

                // Optional: broadcast event for realtime UI (if frontend listens)
                // broadcast(new \App\Events\NotificationUpdated($user->id, []));

                $this->info("{$company->name}: Level {$old} -> {$targetLevel}");
                $leveledUpCount++;
            }
        }

        $this->info("Company level recalculation complete. Leveled up: {$leveledUpCount}");
        return Command::SUCCESS;
    }
}


