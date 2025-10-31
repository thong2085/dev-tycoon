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
            
            // Check if project has assigned employees (via assigned_project_id)
            $assignedEmployees = Employee::where('assigned_project_id', $project->id)->get();
            
            if ($assignedEmployees->count() > 0) {
                // Employees speed up progress based on their effective productivity
                $totalProductivity = 0;
                
                foreach ($assignedEmployees as $employee) {
                    // Add employee's effective productivity
                    $totalProductivity += $employee->getEffectiveProductivity();
                    
                    // Decrease energy and morale while working
                    $oldEnergy = $employee->energy;
                    $oldMorale = $employee->morale;
                    
                    $employee->energy = max(0, $employee->energy - 1);
                    $employee->updateMorale();
                    $employee->save();
                    
                    // Broadcast if employee now needs rest (crossed threshold)
                    if (($oldEnergy >= 30 && $employee->energy < 30) || 
                        ($oldMorale >= 30 && $employee->morale < 30)) {
                        // Employee just crossed into "needs rest" territory
                        $this->broadcastNotificationUpdate($user);
                    }
                }
                
                $progressRate += ($totalProductivity / 100);
            }
            
            // Update progress
            $project->progress = min(100, $project->progress + $progressRate);
            
            // Mark as completed if done
            if ($project->progress >= 100) {
                $project->status = 'completed';
                $project->progress = 100;
                
                // Give XP to employees who worked on this project
                foreach ($assignedEmployees as $employee) {
                    $xpGain = $project->difficulty * 20; // 20 XP per difficulty level
                    $leveledUp = $employee->addExperience($xpGain);
                    
                    $employee->projects_completed += 1;
                    $employee->assigned_project_id = null;
                    $employee->status = 'idle';
                    $employee->save();
                    
                    if ($leveledUp) {
                        $this->info("{$employee->name} leveled up to level {$employee->level}!");
                    }
                }
                
                // Broadcast realtime notification
                broadcast(new \App\Events\ProjectCompleted($project));
                $this->broadcastNotificationUpdate($user);
                
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

    /**
     * Broadcast notification count update to user
     */
    protected function broadcastNotificationUpdate($user): void
    {
        $company = $user->company;
        
        $counts = [
            'projects' => \App\Models\Project::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count(),
            'achievements' => $user->achievements()
                ->wherePivot('unlocked_at', '>=', now()->subHours(24))
                ->count(),
            'employees' => 0,
        ];
        
        if ($company) {
            $counts['employees'] = \App\Models\Employee::where('company_id', $company->id)
                ->where(function ($query) {
                    $query->where('energy', '<', 30)
                          ->orWhere('morale', '<', 30);
                })
                ->count();
        }
        
        broadcast(new \App\Events\NotificationUpdated($user->id, $counts));
    }
}

