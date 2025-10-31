<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\Employee;
use Illuminate\Console\Command;

class ProcessProjects extends Command
{
    protected $signature = 'game:process-projects';
    protected $description = 'Process active projects and update their progress';

    public function handle()
    {
        $projects = Project::where('status', 'in_progress')->get();

        foreach ($projects as $project) {
            // Calculate progress based on difficulty
            $progressRate = 5; // Base 5% per minute (faster for testing)
            
            // Adjust based on difficulty (harder = slower)
            $progressRate = $progressRate / ($project->difficulty * 0.3);
            
            // Get user's relevant skills for this project type
            $user = $project->user;
            $skillBonus = 0;
            
            if ($user) {
                $userSkills = $user->skills()
                    ->withPivot(['level', 'experience'])
                    ->get();
                
                // Calculate bonus from relevant skills
                foreach ($userSkills as $skill) {
                    $projectTypes = $skill->project_types ?? [];
                    
                    // Check if skill is relevant for this project
                    if (is_array($projectTypes)) {
                        foreach ($projectTypes as $type) {
                            if (stripos($project->title, $type) !== false) {
                                // Add efficiency bonus: skill level * efficiency_bonus
                                $skillBonus += $skill->pivot->level * floatval($skill->efficiency_bonus);
                                break; // Only count each skill once
                            }
                        }
                    }
                }
                
                // Apply skill bonus as percentage multiplier
                $progressRate *= (1 + $skillBonus);
            }
            
            // Check if project has assigned employees
            $assignedEmployees = $project->tasks()
                ->whereNotNull('assigned_employee_id')
                ->with('assignedEmployee')
                ->get();
            
            if ($assignedEmployees->count() > 0) {
                // Employees speed up progress
                $totalProductivity = $assignedEmployees->sum(function ($task) {
                    return $task->assignedEmployee ? 
                        $task->assignedEmployee->getEffectiveProductivity() : 0;
                });
                
                $progressRate += ($totalProductivity / 100);
            }
            
            // Update progress
            $project->progress = min(100, $project->progress + $progressRate);
            
            // Mark as completed if done
            if ($project->progress >= 100) {
                $project->status = 'completed';
                $project->progress = 100;
                
                $this->info("Project #{$project->id} '{$project->title}' completed!");
            }
            
            // Check if overdue
            if ($project->deadline && now()->isAfter($project->deadline) && $project->status !== 'completed') {
                $project->status = 'failed';
                $this->warn("Project #{$project->id} '{$project->title}' failed (deadline passed)");
            }
            
            $project->save();
        }

        $this->info("Processed {$projects->count()} active projects");
        
        return Command::SUCCESS;
    }
}

