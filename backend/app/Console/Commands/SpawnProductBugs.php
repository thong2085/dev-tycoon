<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\ProductBug;
use App\Models\User;
use Illuminate\Console\Command;

class SpawnProductBugs extends Command
{
    protected $signature = 'game:spawn-product-bugs';
    protected $description = 'Randomly spawn bugs on active products';

    private $bugTemplates = [
        [
            'title' => 'Database Connection Timeout',
            'description' => 'Users experiencing slow page loads due to database connection issues. Affecting user experience.',
            'severity' => 'high',
            'revenue_penalty' => 15.00,
            'fix_cost' => 500,
            'fix_time_minutes' => 10,
        ],
        [
            'title' => 'Memory Leak in Background Jobs',
            'description' => 'Server memory usage increasing over time. Causing occasional crashes and downtime.',
            'severity' => 'critical',
            'revenue_penalty' => 25.00,
            'fix_cost' => 1000,
            'fix_time_minutes' => 20,
        ],
        [
            'title' => 'API Rate Limiting Too Aggressive',
            'description' => 'Users complaining about frequent rate limit errors. Losing potential customers.',
            'severity' => 'medium',
            'revenue_penalty' => 10.00,
            'fix_cost' => 300,
            'fix_time_minutes' => 5,
        ],
        [
            'title' => 'Payment Gateway Integration Error',
            'description' => 'Random payment failures occurring. Direct revenue impact.',
            'severity' => 'critical',
            'revenue_penalty' => 30.00,
            'fix_cost' => 1500,
            'fix_time_minutes' => 15,
        ],
        [
            'title' => 'Email Notification System Down',
            'description' => 'Users not receiving important notifications. Affecting engagement.',
            'severity' => 'low',
            'revenue_penalty' => 5.00,
            'fix_cost' => 200,
            'fix_time_minutes' => 3,
        ],
        [
            'title' => 'Cache Invalidation Bug',
            'description' => 'Stale data being served to users. Causing confusion and support tickets.',
            'severity' => 'medium',
            'revenue_penalty' => 12.00,
            'fix_cost' => 400,
            'fix_time_minutes' => 8,
        ],
        [
            'title' => 'Mobile App Crash on iOS 17',
            'description' => 'App crashing for users on latest iOS version. Losing mobile revenue.',
            'severity' => 'high',
            'revenue_penalty' => 20.00,
            'fix_cost' => 800,
            'fix_time_minutes' => 12,
        ],
        [
            'title' => 'Third-Party API Deprecation',
            'description' => 'External API we depend on is being deprecated. Need to migrate to new version.',
            'severity' => 'high',
            'revenue_penalty' => 18.00,
            'fix_cost' => 600,
            'fix_time_minutes' => 25,
        ],
    ];

    public function handle()
    {
        $products = Product::where('active', true)->with('bugs')->get();
        $spawnedCount = 0;

        foreach ($products as $product) {
            // Skip if product already has active bugs (max 2 bugs per product)
            $activeBugs = $product->getActiveBugs();
            if ($activeBugs->count() >= 2) {
                continue;
            }

            // 15% chance per product to spawn a bug each run
            if (random_int(1, 100) <= 15) {
                $template = $this->bugTemplates[array_rand($this->bugTemplates)];
                
                $bug = ProductBug::create([
                    'product_id' => $product->id,
                    'title' => $template['title'],
                    'description' => $template['description'],
                    'severity' => $template['severity'],
                    'revenue_penalty' => $template['revenue_penalty'],
                    'fix_cost' => $template['fix_cost'],
                    'fix_time_minutes' => $template['fix_time_minutes'],
                    'status' => 'active',
                    'discovered_at' => now(),
                ]);

                $spawnedCount++;
                $this->info("Spawned bug '{$template['title']}' on product: {$product->name}");
                
                // Broadcast notification update
                $this->broadcastNotificationUpdate($product->user);
            }
        }

        $this->info("Spawned {$spawnedCount} bugs across products");
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

