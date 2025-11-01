<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MarketEvent;
use App\Services\GeminiService;

class TriggerMarketEvent extends Command
{
    protected $signature = 'game:trigger-market-event';
    protected $description = 'Randomly trigger short-lived market events that affect gameplay';

    public function handle()
    {
        // 40% chance to spawn a new event each run
        if (random_int(1, 100) > 40) {
            $this->info('No new market event this tick.');
            return Command::SUCCESS;
        }

        // 30% chance to use AI-generated event, 70% for static events
        $useAI = random_int(1, 100) <= 30;
        
        if ($useAI) {
            $gemini = new GeminiService();
            $aiEvent = $gemini->generateMarketEvent();
            
            if ($aiEvent) {
                $start = now();
                $duration = $aiEvent['duration_minutes'] ?? 10;
                $end = now()->addMinutes($duration);
                
                // Convert AI effect format to game effect format
                $effect = [];
                if (isset($aiEvent['effect'])) {
                    $effectType = $aiEvent['effect']['type'] ?? 'revenue';
                    $effectValue = $aiEvent['effect']['value'] ?? 0;
                    
                    // Map effect type to game multipliers
                    if ($effectType === 'revenue') {
                        $effect['global_revenue_multiplier'] = $effectValue;
                    } elseif ($effectType === 'progress') {
                        $effect['project_progress_multiplier'] = $effectValue;
                    } elseif ($effectType === 'cost') {
                        $effect['upkeep_multiplier'] = abs($effectValue); // Ensure positive for costs
                    } elseif ($effectType === 'bonus') {
                        $effect['global_revenue_multiplier'] = $effectValue;
                    }
                }
                
                $event = MarketEvent::create([
                    'event_type' => $aiEvent['event_type'] ?? 'ai_event_' . uniqid(),
                    'description' => $aiEvent['description'] ?? 'AI-generated market event',
                    'effect' => $effect,
                    'start_time' => $start,
                    'end_time' => $end,
                ]);

                $this->info("Spawned AI market event: {$event->event_type} (until {$end})");
                return Command::SUCCESS;
            } else {
                $this->warn('AI event generation failed, falling back to static events');
            }
        }

        // Fallback: Static events
        $events = [
            [
                'type' => 'market_boom',
                'description' => 'Market Boom! Consumers are spending more.',
                'effect' => [ 'global_revenue_multiplier' => 0.5 ], // +50%
                'duration_minutes' => 10,
            ],
            [
                'type' => 'tech_crash',
                'description' => 'Tech Crash! Investors cut budgets.',
                'effect' => [ 'global_revenue_multiplier' => -0.3 ], // -30%
                'duration_minutes' => 10,
            ],
            [
                'type' => 'hype_trend',
                'description' => 'Hype Trend! Teams move faster on projects.',
                'effect' => [ 'project_progress_multiplier' => 0.2 ], // +20%
                'duration_minutes' => 10,
            ],
            [
                'type' => 'bug_outbreak',
                'description' => 'Bug Outbreak! Maintenance costs rise.',
                'effect' => [ 'upkeep_multiplier' => 0.15 ], // +15% upkeep
                'duration_minutes' => 10,
            ],
        ];

        $chosen = $events[array_rand($events)];
        $start = now();
        $end = now()->addMinutes($chosen['duration_minutes']);

        $event = MarketEvent::create([
            'event_type' => $chosen['type'],
            'description' => $chosen['description'],
            'effect' => $chosen['effect'],
            'start_time' => $start,
            'end_time' => $end,
        ]);

        $this->info("Spawned static market event: {$event->event_type} (until {$end})");
        return Command::SUCCESS;
    }
}


