<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\Leaderboard;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $projects = $user->projects()->with('tasks')->latest()->paginate(10);

        return response()->json($projects);
    }

    /**
     * Get available jobs from global job board (AI-generated)
     */
    public function availableJobs(Request $request)
    {
        $user = $request->user();
        
        // Get ALL global jobs (user_id IS NULL)
        // Frontend will handle locking based on reputation
        $jobs = Project::whereNull('user_id')
            ->where('status', 'available')
            ->orderBy('required_reputation', 'asc') // Show easier jobs first
            ->orderBy('created_at', 'desc')
            ->limit(50) // Increased limit
            ->get();

        return response()->json($jobs);
    }

    /**
     * Accept a job from the job board
     */
    public function acceptJob(Request $request, $id)
    {
        $user = $request->user();
        $gameState = $user->gameState;
        
        $job = Project::whereNull('user_id')
            ->where('status', 'available')
            ->findOrFail($id);
        
        // Check reputation requirement
        if ($gameState->reputation < $job->required_reputation) {
            return response()->json([
                'error' => "You need {$job->required_reputation} reputation to accept this job"
            ], 403);
        }
        
        // Get or create user's company
        $company = $user->company;
        if (!$company) {
            $company = \App\Models\Company::create([
                'user_id' => $user->id,
                'name' => $user->name . "'s Company",
                'company_level' => 1,
                'cash' => 0,
                'monthly_revenue' => 0,
                'monthly_costs' => 0,
            ]);
        }
        
        // Claim the job for this user
        $job->user_id = $user->id;
        $job->company_id = $company->id;
        $job->status = 'queued';
        $job->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Job accepted! Go to Active Projects to start working.',
            'project' => $job,
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $project = $user->projects()->with('tasks.assignedEmployee')->findOrFail($id);

        return response()->json($project);
    }

    public function start(Request $request)
    {
        $user = $request->user();
        
        // Check if starting existing project (by ID)
        if ($request->has('project_id')) {
            $project = $user->projects()->findOrFail($request->project_id);
            
            if ($project->status !== 'queued') {
                return response()->json(['error' => 'Project already started or completed'], 400);
            }
            
            // Check if user has enough reputation
            $gameState = $user->gameState;
            if ($gameState->reputation < $project->required_reputation) {
                return response()->json([
                    'error' => "You need {$project->required_reputation} reputation to start this project (you have {$gameState->reputation})"
                ], 403);
            }
            
            // Start the existing project
            $project->update([
                'status' => 'in_progress',
                'started_at' => now(),
                'deadline' => now()->addHours($project->difficulty * 2),
            ]);
            
            // Create tasks for the project
            $taskCount = max(3, $project->difficulty);
            for ($i = 1; $i <= $taskCount; $i++) {
                ProjectTask::create([
                    'project_id' => $project->id,
                    'title' => "Task $i",
                    'estimated_hours' => rand(2, 8),
                    'progress' => 0,
                ]);
            }
            
            return response()->json($project->load('tasks'), 200);
        }
        
        // Otherwise, create new project from form input (old behavior)
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'difficulty' => 'required|integer|min:1|max:10',
        ]);

        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        // Calculate reward and required reputation based on difficulty
        $reward = $request->difficulty * 100;
        $requiredReputation = max(0, ($request->difficulty - 1) * 100);

        $project = Project::create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'difficulty' => $request->difficulty,
            'required_reputation' => $requiredReputation,
            'reward' => $reward,
            'progress' => 0,
            'started_at' => now(),
            'deadline' => now()->addHours($request->difficulty * 2),
            'status' => 'in_progress',
        ]);

        // Create tasks for the project
        $taskCount = max(3, $request->difficulty);
        for ($i = 1; $i <= $taskCount; $i++) {
            ProjectTask::create([
                'project_id' => $project->id,
                'title' => "Task $i",
                'estimated_hours' => rand(2, 8),
                'progress' => 0,
            ]);
        }

        return response()->json($project->load('tasks'), 201);
    }

    public function claim(Request $request, $id)
    {
        $user = $request->user();
        $project = $user->projects()->findOrFail($id);

        if ($project->status !== 'completed') {
            return response()->json(['error' => 'Project not completed yet'], 400);
        }

        // Calculate skill bonuses
        $skillBonus = $user->getSkillBonusForProject($project->title);
        $rewardMultiplier = 1 + ($skillBonus * 0.5); // 50% of skill bonus applies to reward
        $xpMultiplier = 1 + ($skillBonus * 0.3); // 30% of skill bonus applies to XP
        $reputationMultiplier = 1 + ($skillBonus * 0.2); // 20% of skill bonus applies to reputation
        
        // Apply research bonuses
        $researchBonuses = $this->getResearchBonuses($user);
        $rewardMultiplier *= (1 + ($researchBonuses['project_reward_multiplier'] ?? 0));
        
        // Calculate final values
        $finalReward = $project->reward * $rewardMultiplier;
        $baseXp = $project->difficulty * 10;
        $finalXp = $baseXp * $xpMultiplier;
        $baseReputation = $project->difficulty * 5;
        $finalReputation = $baseReputation * $reputationMultiplier;
        
        // Add reward to COMPANY cash only (remove gameState money duplication)
        $gameState = $user->gameState;
        $gameState->xp += $finalXp;
        $gameState->reputation += $finalReputation;
        $gameState->completed_projects += 1;
        $gameState->save();

        // Update company cash (project reward is one-time income)
        $company = $user->company;
        if ($company) {
            $company->cash += $finalReward;
            $company->save();
        }

        // Update leaderboard
        Leaderboard::updateEntry($user->id, $gameState, $company);

        // Mark project as claimed by deleting or updating status
        $project->delete();

        return response()->json([
            'success' => true,
            'reward' => $finalReward,
            'base_reward' => $project->reward,
            'xp_gain' => $finalXp,
            'reputation_gain' => $finalReputation,
            'skill_bonus' => $skillBonus,
            'data' => $gameState,
        ]);
    }

    protected function getResearchBonuses($user): array
    {
        if (!$user) return [];
        
        $bonuses = [];
        $researches = $user->researches()->get();
        
        foreach ($researches as $research) {
            $effects = $research->effects ?? [];
            foreach ($effects as $key => $value) {
                if (!isset($bonuses[$key])) {
                    $bonuses[$key] = 0;
                }
                $bonuses[$key] += $value;
            }
        }
        
        return $bonuses;
    }
}

