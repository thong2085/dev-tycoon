<?php

namespace App\Console\Commands;

use App\Models\ProductBug;
use Illuminate\Console\Command;

class CompleteBugFixes extends Command
{
    protected $signature = 'game:complete-bug-fixes';
    protected $description = 'Complete bug fixes that have reached their fix time';

    public function handle()
    {
        // Get bugs that are in 'fixing' status and have passed their fix_time_minutes
        $bugsToComplete = ProductBug::where('status', 'fixing')
            ->whereNotNull('fix_started_at')
            ->get()
            ->filter(function ($bug) {
                if (!$bug->fix_started_at) {
                    return false;
                }
                
                // Calculate when fix should complete
                $fixCompleteTime = $bug->fix_started_at->copy()->addMinutes($bug->fix_time_minutes);
                
                return now() >= $fixCompleteTime;
            });

        $completedCount = 0;
        $usersNotified = [];
        
        foreach ($bugsToComplete as $bug) {
            $bug->status = 'fixed';
            $bug->fixed_at = now();
            $bug->save();
            
            $user = $bug->product->user;
            if ($user && !in_array($user->id, $usersNotified)) {
                $this->broadcastNotificationUpdate($user);
                $usersNotified[] = $user->id;
            }
            
            $completedCount++;
            $this->info("Completed fix for bug: {$bug->title} (Product: {$bug->product->name})");
        }

        $this->info("Completed {$completedCount} bug fixes");
        return Command::SUCCESS;
    }

    protected function broadcastNotificationUpdate($user): void
    {
        if (!$user) return;
        
        $company = $user->company;
        
        $counts = [
            'projects' => \App\Models\Project::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count(),
            'achievements' => $user->achievements()
                ->wherePivot('unlocked_at', '>=', now()->subHours(24))
                ->count(),
            'employees' => 0,
            'products' => \App\Models\ProductBug::whereHas('product', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
                ->where('status', 'active')
                ->count(),
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

