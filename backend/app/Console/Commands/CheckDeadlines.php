<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\NPCQuest;
use App\Models\Company;
use App\Models\GameState;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'game:check-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and process overdue projects and expired quests';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking deadlines...');
        
        // Check overdue projects
        $this->checkOverdueProjects();
        
        // Check expired quests
        $this->checkExpiredQuests();
        
        return 0;
    }

    /**
     * Check and fail overdue projects
     */
    protected function checkOverdueProjects()
    {
        $overdueProjects = Project::whereIn('status', ['queued', 'in_progress'])
            ->whereNotNull('deadline')
            ->where('deadline', '<', now())
            ->get();

        $failedCount = 0;
        $reputationPenalty = config('game_balance.projects.reputation_penalty_per_difficulty', 5);

        foreach ($overdueProjects as $project) {
            // Mark project as failed
            $project->status = 'failed';
            $project->save();

            // Apply reputation penalty based on difficulty
            $gameState = GameState::where('user_id', $project->user_id)->first();
            if ($gameState) {
                $penalty = $project->difficulty * $reputationPenalty;
                $gameState->reputation = max(0, $gameState->reputation - $penalty);
                $gameState->save();
                
                Log::info("Project failed: #{$project->id} '{$project->title}'", [
                    'user_id' => $project->user_id,
                    'difficulty' => $project->difficulty,
                    'reputation_penalty' => $penalty,
                ]);
            }

            $failedCount++;
            $this->warn("Project #{$project->id} '{$project->title}' failed (deadline passed) - Reputation penalty: -{$penalty}");
        }

        if ($failedCount > 0) {
            $this->info("Failed {$failedCount} overdue project(s)");
        }
    }

    /**
     * Check and expire quests that passed their expiry time
     */
    protected function checkExpiredQuests()
    {
        $expiredQuests = NPCQuest::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        $expiredCount = 0;

        foreach ($expiredQuests as $quest) {
            // Mark quest as expired
            $quest->status = 'expired';
            $quest->save();

            // Optional: Apply small reputation penalty for expired quests
            $reputationPenalty = config('game_balance.quests.expiry_reputation_penalty', 2);
            $gameState = GameState::where('user_id', $quest->user_id)->first();
            if ($gameState && $reputationPenalty > 0) {
                $gameState->reputation = max(0, $gameState->reputation - $reputationPenalty);
                $gameState->save();
            }

            $expiredCount++;
            $this->warn("Quest #{$quest->id} '{$quest->title}' expired");
        }

        if ($expiredCount > 0) {
            $this->info("Expired {$expiredCount} quest(s)");
        }
    }
}
