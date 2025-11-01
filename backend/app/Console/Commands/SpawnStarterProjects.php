<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Command;

class SpawnStarterProjects extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'game:spawn-starter-projects';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Spawn starter projects for low-level players (difficulty 1-3)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Spawning starter projects for low-level players...');
        
        // Check how many available projects exist already
        $availableCount = Project::whereNull('user_id')
            ->where('status', 'available')
            ->where('difficulty', '<=', 3) // Easy projects only
            ->count();
        
        $targetCount = config('game_balance.starter_projects.min_available', 10);
        $spawnCount = max(0, $targetCount - $availableCount);
        
        if ($spawnCount === 0) {
            $this->info("Already have {$availableCount} starter projects available. No need to spawn more.");
            return 0;
        }
        
        $this->info("Need to spawn {$spawnCount} more starter projects...");
        
        // Define starter projects template
        $starterProjects = $this->getStarterProjectTemplates();
        
        $created = 0;
        foreach ($starterProjects as $index => $template) {
            if ($created >= $spawnCount) {
                break;
            }
            
            // Randomize reward and deadline slightly
            $difficulty = rand(1, 3); // Easy projects for beginners
            $reward = config('game_balance.projects.reward_multiplier', 150) * $difficulty;
            $deadlineHours = config('game_balance.projects.deadline_hours_per_difficulty', 3) * $difficulty;
            
            Project::create([
                'user_id' => null, // NULL = Available for all players
                'company_id' => null, // NULL = Not assigned to any company yet
                'title' => $template['title'],
                'description' => $template['description'],
                'difficulty' => $difficulty,
                'required_reputation' => 0, // No reputation needed for starter projects
                'reward' => $reward,
                'status' => 'available',
                'progress' => 0,
                'deadline' => now()->addHours($deadlineHours),
            ]);
            
            $created++;
        }
        
        $this->info("✅ Spawned {$created} starter projects successfully!");
        
        return 0;
    }
    
    /**
     * Get starter project templates for low-level players
     */
    private function getStarterProjectTemplates(): array
    {
        return [
            [
                'title' => 'Build a Simple Calculator App',
                'description' => 'Create a basic calculator web app with HTML, CSS, and JavaScript. Include addition, subtraction, multiplication, and division functions.',
            ],
            [
                'title' => 'Design a Personal Blog',
                'description' => 'Build a simple blog website with a responsive design. Include a header, navigation menu, and article layout.',
            ],
            [
                'title' => 'Create a To-Do List App',
                'description' => 'Develop a to-do list application where users can add, edit, and delete tasks. Store data in localStorage.',
            ],
            [
                'title' => 'Build a Weather Widget',
                'description' => 'Create a weather display widget using a free weather API. Show current temperature and conditions for a city.',
            ],
            [
                'title' => 'Design a Landing Page',
                'description' => 'Build an attractive landing page for a fictional product. Include hero section, features, and call-to-action.',
            ],
            [
                'title' => 'Create a Random Quote Generator',
                'description' => 'Build a web app that displays random motivational quotes. Include a button to generate new quotes.',
            ],
            [
                'title' => 'Build a Password Generator',
                'description' => 'Create a secure password generator with customizable length and character types (letters, numbers, symbols).',
            ],
            [
                'title' => 'Design a Portfolio Website',
                'description' => 'Build a simple portfolio website showcasing projects and skills. Include an "About Me" section and contact form.',
            ],
            [
                'title' => 'Create a Color Palette Generator',
                'description' => 'Develop a tool that generates random color palettes. Allow users to copy hex codes for each color.',
            ],
            [
                'title' => 'Build a Pomodoro Timer',
                'description' => 'Create a productivity timer app with 25-minute work sessions and 5-minute breaks. Include start, pause, and reset functions.',
            ],
            [
                'title' => 'Design a Countdown Timer',
                'description' => 'Build a custom countdown timer for events. Allow users to set target date and time.',
            ],
            [
                'title' => 'Create a Note-Taking App',
                'description' => 'Develop a simple note-taking application with the ability to create, save, and delete notes. Use localStorage for persistence.',
            ],
            [
                'title' => 'Build a Unit Converter',
                'description' => 'Create a converter tool for common units (length, weight, temperature). Include multiple conversion options.',
            ],
            [
                'title' => 'Design a Recipe Card Maker',
                'description' => 'Build a web app for creating beautiful recipe cards. Include fields for ingredients, instructions, and cooking time.',
            ],
            [
                'title' => 'Create a Magic 8-Ball',
                'description' => 'Develop a digital Magic 8-Ball that gives random answers to yes/no questions. Include fun animations.',
            ],
        ];
    }
}
