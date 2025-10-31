<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ShopItem;

class ShopItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // Boosters
            [
                'key' => 'income_boost_2x',
                'name' => '2x Income Booster',
                'description' => 'Double your income for 1 hour!',
                'icon' => '🚀',
                'category' => 'booster',
                'price' => 5000,
                'duration_minutes' => 60,
                'effect_type' => 'multiplier',
                'effect_data' => ['type' => 'income', 'multiplier' => 2],
                'order' => 1,
            ],
            [
                'key' => 'xp_boost_2x',
                'name' => '2x XP Booster',
                'description' => 'Double your XP gains for 1 hour!',
                'icon' => '💎',
                'category' => 'booster',
                'price' => 7500,
                'duration_minutes' => 60,
                'effect_type' => 'multiplier',
                'effect_data' => ['type' => 'xp', 'multiplier' => 2],
                'order' => 2,
            ],
            [
                'key' => 'project_speed_2x',
                'name' => '2x Project Speed',
                'description' => 'Complete projects 2x faster for 1 hour!',
                'icon' => '⚡',
                'category' => 'booster',
                'price' => 10000,
                'duration_minutes' => 60,
                'effect_type' => 'multiplier',
                'effect_data' => ['type' => 'project_speed', 'multiplier' => 2],
                'order' => 3,
            ],
            [
                'key' => 'mega_boost',
                'name' => 'Mega Boost',
                'description' => '3x everything for 30 minutes!',
                'icon' => '🔥',
                'category' => 'booster',
                'price' => 25000,
                'duration_minutes' => 30,
                'effect_type' => 'multiplier',
                'effect_data' => ['type' => 'all', 'multiplier' => 3],
                'order' => 4,
            ],

            // Instant Effects
            [
                'key' => 'instant_project',
                'name' => 'Complete Project Instantly',
                'description' => 'Instantly complete your current project!',
                'icon' => '⏱️',
                'category' => 'special',
                'price' => 10000,
                'duration_minutes' => null,
                'effect_type' => 'instant',
                'effect_data' => ['type' => 'complete_project'],
                'order' => 10,
            ],
            [
                'key' => 'reputation_boost',
                'name' => 'Reputation Boost',
                'description' => 'Instantly gain +100 reputation!',
                'icon' => '🌟',
                'category' => 'special',
                'price' => 15000,
                'duration_minutes' => null,
                'effect_type' => 'instant',
                'effect_data' => ['type' => 'reputation', 'amount' => 100],
                'order' => 11,
            ],
            [
                'key' => 'skill_points',
                'name' => 'Instant Skill Points',
                'description' => 'Instantly max out a random skill to its highest level!',
                'icon' => '💡',
                'category' => 'special',
                'price' => 12000,
                'duration_minutes' => null,
                'effect_type' => 'instant',
                'effect_data' => ['type' => 'skill_xp', 'amount' => 1000],
                'order' => 12,
            ],

            // Permanent Items
            [
                'key' => 'auto_clicker',
                'name' => 'Auto-Clicker',
                'description' => 'Automatically clicks once per second forever!',
                'icon' => '🤖',
                'category' => 'permanent',
                'price' => 50000,
                'duration_minutes' => null,
                'effect_type' => 'permanent',
                'effect_data' => ['type' => 'auto_click', 'interval' => 1],
                'order' => 20,
            ],
            [
                'key' => 'offline_boost',
                'name' => 'Enhanced Offline Earnings',
                'description' => 'Earn 50% more while offline (permanent)!',
                'icon' => '💤',
                'category' => 'permanent',
                'price' => 75000,
                'duration_minutes' => null,
                'effect_type' => 'permanent',
                'effect_data' => ['type' => 'offline_multiplier', 'multiplier' => 1.5],
                'order' => 21,
            ],
            [
                'key' => 'lucky_projects',
                'name' => 'Lucky Projects',
                'description' => '10% chance to get double project rewards (permanent)!',
                'icon' => '🍀',
                'category' => 'permanent',
                'price' => 100000,
                'duration_minutes' => null,
                'effect_type' => 'permanent',
                'effect_data' => ['type' => 'lucky_chance', 'chance' => 0.1, 'multiplier' => 2],
                'order' => 22,
            ],
        ];

        foreach ($items as $item) {
            ShopItem::create($item);
        }

        $this->command->info('Created ' . count($items) . ' shop items!');
    }
}

