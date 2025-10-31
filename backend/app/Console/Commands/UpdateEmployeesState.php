<?php

namespace App\Console\Commands;

use App\Models\Employee;
use Illuminate\Console\Command;

class UpdateEmployeesState extends Command
{
    protected $signature = 'game:update-employees-state';
    protected $description = 'Update employee energy and morale states (for idle employees)';

    public function handle()
    {
        // Update all employees (both working and idle)
        $employees = Employee::all();
        $updated = 0;

        foreach ($employees as $employee) {
            $employee->updateMorale(); // This now also restores energy for idle employees
            $updated++;
        }

        $this->info("✅ Updated {$updated} employees (energy & morale)");
        
        return Command::SUCCESS;
    }
}

