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

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $project = $user->projects()->with('tasks.assignedEmployee')->findOrFail($id);

        return response()->json($project);
    }

    public function start(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'difficulty' => 'required|integer|min:1|max:10',
        ]);

        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        // Calculate reward based on difficulty
        $reward = $request->difficulty * 100;

        $project = Project::create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'difficulty' => $request->difficulty,
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
        
        // Calculate final values
        $finalReward = $project->reward * $rewardMultiplier;
        $baseXp = $project->difficulty * 10;
        $finalXp = $baseXp * $xpMultiplier;
        $baseReputation = $project->difficulty * 5;
        $finalReputation = $baseReputation * $reputationMultiplier;
        
        // Add reward to game state
        $gameState = $user->gameState;
        $gameState->money += $finalReward;
        $gameState->xp += $finalXp;
        $gameState->reputation += $finalReputation;
        $gameState->completed_projects += 1;
        
        $gameState->save();

        // Update leaderboard
        Leaderboard::updateEntry($user->id, $gameState);

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
}

