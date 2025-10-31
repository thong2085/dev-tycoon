<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Employee;
use Illuminate\Console\Command;

class PaySalaries extends Command
{
    protected $signature = 'game:pay-salaries';
    protected $description = 'Pay employee salaries (deduct from company cash)';

    public function handle()
    {
        $companies = Company::with('employees')->get();
        $totalPaid = 0;
        $companiesPaid = 0;

        foreach ($companies as $company) {
            $employees = $company->employees;
            
            if ($employees->count() === 0) {
                continue; // No employees, skip
            }

            // Calculate total salary for this company
            $monthlySalary = $employees->sum('salary');
            
            // Convert monthly to daily (30 days in a month, but in-game 1 minute = 1 day)
            // For game balance, we'll pay monthly salary per day
            $dailySalary = $monthlySalary / 30;

            // Check if company can afford
            if ($company->cash >= $dailySalary) {
                // Pay salaries
                $company->cash -= $dailySalary;
                $company->monthly_costs = $monthlySalary; // Update monthly costs
                $company->save();

                $totalPaid += $dailySalary;
                $companiesPaid++;
                
                $this->info("Company '{$company->name}' paid \${$dailySalary} salary to {$employees->count()} employee(s)");
            } else {
                // Not enough money - employees lose morale!
                $this->warn("Company '{$company->name}' cannot afford salaries! (\${$company->cash} < \${$dailySalary})");
                
                foreach ($employees as $employee) {
                    $employee->morale = max(0, $employee->morale - 10); // -10 morale for unpaid salary
                    $employee->save();
                }
                
                // Broadcast notification to user
                $user = $company->user;
                if ($user) {
                    broadcast(new \App\Events\NotificationUpdated($user->id, [
                        'projects' => \App\Models\Project::where('user_id', $user->id)
                            ->where('status', 'completed')
                            ->count(),
                        'achievements' => $user->achievements()
                            ->wherePivot('unlocked_at', '>=', now()->subHours(24))
                            ->count(),
                        'employees' => $employees->count(), // All employees need attention!
                    ]));
                }
            }
        }

        $this->info("✅ Salary payment complete: {$companiesPaid} companies, \${$totalPaid} total paid");
        
        return Command::SUCCESS;
    }
}

