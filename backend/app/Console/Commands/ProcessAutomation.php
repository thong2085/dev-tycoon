<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Company;
use Illuminate\Console\Command;

class ProcessAutomation extends Command
{
    protected $signature = 'game:process-automation';
    protected $description = 'Process automation rules (auto rest, auto assign employees)';

    public function handle()
    {
        $users = User::with(['automationSetting', 'companies.employees'])->get();

        $autoRestCount = 0;
        $autoAssignCount = 0;

        foreach ($users as $user) {
            $automation = $user->automationSetting;
            if (!$automation) {
                continue; // Skip if no automation settings
            }

            // Skip if automation is disabled
            if (!$automation->auto_rest_enabled && !$automation->auto_assign_enabled) {
                continue;
            }

            $company = $user->companies()->first();
            if (!$company) {
                continue;
            }

            $employees = $company->employees()->get();

            // Auto Rest: Automatically rest employees who are below thresholds
            if ($automation->auto_rest_enabled) {
                foreach ($employees as $employee) {
                    // Only auto-rest if employee is working (assigned to project)
                    if ($employee->assigned_project_id && $employee->status === 'working') {
                        $shouldRest = false;
                        $reason = '';

                        if ($employee->energy < $automation->auto_rest_energy_threshold) {
                            $shouldRest = true;
                            $reason = "energy low ({$employee->energy}% < {$automation->auto_rest_energy_threshold}%)";
                        } elseif ($employee->morale < $automation->auto_rest_morale_threshold) {
                            $shouldRest = true;
                            $reason = "morale low ({$employee->morale}% < {$automation->auto_rest_morale_threshold}%)";
                        }

                        if ($shouldRest) {
                            $employee->status = 'idle';
                            $employee->assigned_project_id = null;
                            $employee->save();

                            $autoRestCount++;
                            $this->info("Auto-rested {$employee->name} ({$reason})");
                        }
                    }
                }
            }

            // Auto Assign: Automatically assign idle employees to projects
            if ($automation->auto_assign_enabled) {
                $idleEmployees = $employees->filter(function ($emp) use ($automation) {
                    return $emp->status === 'idle' 
                        && !$emp->assigned_project_id
                        && $emp->energy >= $automation->auto_assign_min_energy
                        && $emp->morale >= $automation->auto_assign_min_morale;
                });

                $this->info("User {$user->id}: Found {$idleEmployees->count()} idle employees eligible for auto-assignment");

                if ($idleEmployees->count() > 0) {
                    // Get in-progress projects that need employees
                    $projects = Project::where('user_id', $user->id)
                        ->where('status', 'in_progress')
                        ->orderBy('difficulty', 'desc') // Prioritize harder projects
                        ->get();

                    $this->info("User {$user->id}: Found {$projects->count()} in-progress projects");

                    if ($projects->count() === 0) {
                        continue;
                    }

                    // Calculate how many employees each project should get
                    // Distribute evenly, but consider project difficulty (harder = more employees)
                    $totalDifficulty = $projects->sum('difficulty');
                    $idleEmployeesList = $idleEmployees->values()->all();

                    $projectAssignments = [];
                    foreach ($projects as $project) {
                        $projectAssignments[$project->id] = [
                            'project' => $project,
                            'assigned' => $employees->where('assigned_project_id', $project->id)->count(),
                            'desired' => 0,
                            'needed' => 0,
                        ];
                    }

                    // Calculate desired employees per project based on difficulty
                    $employeeIndex = 0;
                    foreach ($projects as $project) {
                        if ($employeeIndex >= count($idleEmployeesList)) break;
                        
                        // Weight based on difficulty, but distribute more evenly
                        // Each project gets at least 1 employee, then distribute by difficulty
                        $weight = $totalDifficulty > 0 ? ($project->difficulty / $totalDifficulty) : (1 / $projects->count());
                        $maxForProject = max(1, min(10, ceil($idleEmployees->count() * $weight * 2))); // Max 10 per project
                        
                        $assignedCount = $projectAssignments[$project->id]['assigned'];
                        $desired = max(0, $maxForProject - $assignedCount);
                        $projectAssignments[$project->id]['desired'] = $desired;
                        $projectAssignments[$project->id]['needed'] = $desired;
                    }

                    // Round-robin assignment: assign one employee at a time to each project that needs more
                    $employeeIndex = 0;
                    $iterations = 0;
                    $maxIterations = $idleEmployees->count() * 2; // Safety limit

                    while ($employeeIndex < count($idleEmployeesList) && $iterations < $maxIterations) {
                        $assignedThisRound = false;
                        
                        foreach ($projects as $project) {
                            if ($employeeIndex >= count($idleEmployeesList)) break;
                            
                            $assignment = &$projectAssignments[$project->id];
                            if ($assignment['needed'] > 0) {
                                $employee = $idleEmployeesList[$employeeIndex];
                                
                                $employee->assigned_project_id = $project->id;
                                $employee->status = 'working';
                                $employee->save();

                                $assignment['assigned']++;
                                $assignment['needed']--;
                                $employeeIndex++;
                                $autoAssignCount++;
                                $assignedThisRound = true;
                                
                                $this->info("Auto-assigned {$employee->name} to project: {$project->title}");
                            }
                        }
                        
                        if (!$assignedThisRound) {
                            break; // No more projects need employees
                        }
                        
                        $iterations++;
                    }
                }
            }
        }

        $this->info("Automation complete. Auto-rested: {$autoRestCount}, Auto-assigned: {$autoAssignCount}");
        return Command::SUCCESS;
    }
}

