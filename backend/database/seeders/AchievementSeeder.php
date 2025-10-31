<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Achievement;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            // Money Achievements
            ['key' => 'first_dollar', 'name' => 'First Dollar', 'description' => 'Earn your first dollar', 'icon' => '💵', 'category' => 'money', 'requirement_type' => 'money', 'requirement_value' => 1, 'reward_money' => 10, 'reward_xp' => 5, 'reward_prestige_points' => 0, 'order' => 1],
            ['key' => 'thousandaire', 'name' => 'Thousandaire', 'description' => 'Reach $1,000', 'icon' => '💰', 'category' => 'money', 'requirement_type' => 'money', 'requirement_value' => 1000, 'reward_money' => 100, 'reward_xp' => 50, 'reward_prestige_points' => 0, 'order' => 2],
            ['key' => 'ten_thousandaire', 'name' => '10K Club', 'description' => 'Reach $10,000', 'icon' => '💸', 'category' => 'money', 'requirement_type' => 'money', 'requirement_value' => 10000, 'reward_money' => 500, 'reward_xp' => 100, 'reward_prestige_points' => 0, 'order' => 3],
            ['key' => 'hundred_thousandaire', 'name' => 'Six Figures', 'description' => 'Reach $100,000', 'icon' => '💎', 'category' => 'money', 'requirement_type' => 'money', 'requirement_value' => 100000, 'reward_money' => 5000, 'reward_xp' => 500, 'reward_prestige_points' => 1, 'order' => 4],
            ['key' => 'millionaire', 'name' => 'Millionaire', 'description' => 'Reach $1,000,000', 'icon' => '🏆', 'category' => 'money', 'requirement_type' => 'money', 'requirement_value' => 1000000, 'reward_money' => 50000, 'reward_xp' => 5000, 'reward_prestige_points' => 5, 'order' => 5],

            // Level Achievements
            ['key' => 'level_5', 'name' => 'Beginner', 'description' => 'Reach Level 5', 'icon' => '📈', 'category' => 'level', 'requirement_type' => 'level', 'requirement_value' => 5, 'reward_money' => 50, 'reward_xp' => 25, 'reward_prestige_points' => 0, 'order' => 10],
            ['key' => 'level_10', 'name' => 'Intermediate', 'description' => 'Reach Level 10', 'icon' => '⬆️', 'category' => 'level', 'requirement_type' => 'level', 'requirement_value' => 10, 'reward_money' => 200, 'reward_xp' => 100, 'reward_prestige_points' => 0, 'order' => 11],
            ['key' => 'level_25', 'name' => 'Advanced', 'description' => 'Reach Level 25', 'icon' => '🚀', 'category' => 'level', 'requirement_type' => 'level', 'requirement_value' => 25, 'reward_money' => 1000, 'reward_xp' => 500, 'reward_prestige_points' => 1, 'order' => 12],
            ['key' => 'level_50', 'name' => 'Expert', 'description' => 'Reach Level 50', 'icon' => '⭐', 'category' => 'level', 'requirement_type' => 'level', 'requirement_value' => 50, 'reward_money' => 5000, 'reward_xp' => 2500, 'reward_prestige_points' => 2, 'order' => 13],
            ['key' => 'level_100', 'name' => 'Master', 'description' => 'Reach Level 100', 'icon' => '👑', 'category' => 'level', 'requirement_type' => 'level', 'requirement_value' => 100, 'reward_money' => 25000, 'reward_xp' => 10000, 'reward_prestige_points' => 10, 'order' => 14],

            // Project Achievements
            ['key' => 'first_project', 'name' => 'First Client', 'description' => 'Complete your first project', 'icon' => '📋', 'category' => 'projects', 'requirement_type' => 'projects', 'requirement_value' => 1, 'reward_money' => 50, 'reward_xp' => 20, 'reward_prestige_points' => 0, 'order' => 20],
            ['key' => 'projects_10', 'name' => 'Freelancer', 'description' => 'Complete 10 projects', 'icon' => '💼', 'category' => 'projects', 'requirement_type' => 'projects', 'requirement_value' => 10, 'reward_money' => 500, 'reward_xp' => 200, 'reward_prestige_points' => 0, 'order' => 21],
            ['key' => 'projects_50', 'name' => 'Contractor', 'description' => 'Complete 50 projects', 'icon' => '🏢', 'category' => 'projects', 'requirement_type' => 'projects', 'requirement_value' => 50, 'reward_money' => 5000, 'reward_xp' => 1000, 'reward_prestige_points' => 2, 'order' => 22],
            ['key' => 'projects_100', 'name' => 'Agency Owner', 'description' => 'Complete 100 projects', 'icon' => '🏆', 'category' => 'projects', 'requirement_type' => 'projects', 'requirement_value' => 100, 'reward_money' => 20000, 'reward_xp' => 5000, 'reward_prestige_points' => 5, 'order' => 23],

            // Employee Achievements
            ['key' => 'first_hire', 'name' => 'Team Builder', 'description' => 'Hire your first employee', 'icon' => '👥', 'category' => 'employees', 'requirement_type' => 'employees', 'requirement_value' => 1, 'reward_money' => 100, 'reward_xp' => 50, 'reward_prestige_points' => 0, 'order' => 30],
            ['key' => 'employees_5', 'name' => 'Small Team', 'description' => 'Hire 5 employees', 'icon' => '👨‍💼', 'category' => 'employees', 'requirement_type' => 'employees', 'requirement_value' => 5, 'reward_money' => 1000, 'reward_xp' => 500, 'reward_prestige_points' => 1, 'order' => 31],
            ['key' => 'employees_10', 'name' => 'Growing Business', 'description' => 'Hire 10 employees', 'icon' => '🏢', 'category' => 'employees', 'requirement_type' => 'employees', 'requirement_value' => 10, 'reward_money' => 5000, 'reward_xp' => 2500, 'reward_prestige_points' => 3, 'order' => 32],
            ['key' => 'employees_20', 'name' => 'Corporate', 'description' => 'Hire 20 employees', 'icon' => '🏛️', 'category' => 'employees', 'requirement_type' => 'employees', 'requirement_value' => 20, 'reward_money' => 20000, 'reward_xp' => 10000, 'reward_prestige_points' => 10, 'order' => 33],

            // Skills Achievements
            ['key' => 'first_skill', 'name' => 'Student', 'description' => 'Unlock your first skill', 'icon' => '💡', 'category' => 'skills', 'requirement_type' => 'skills', 'requirement_value' => 1, 'reward_money' => 50, 'reward_xp' => 25, 'reward_prestige_points' => 0, 'order' => 40],
            ['key' => 'skills_10', 'name' => 'Learner', 'description' => 'Unlock 10 skills', 'icon' => '📚', 'category' => 'skills', 'requirement_type' => 'skills', 'requirement_value' => 10, 'reward_money' => 1000, 'reward_xp' => 500, 'reward_prestige_points' => 1, 'order' => 41],
            ['key' => 'skills_25', 'name' => 'Polyglot', 'description' => 'Unlock 25 skills', 'icon' => '🌟', 'category' => 'skills', 'requirement_type' => 'skills', 'requirement_value' => 25, 'reward_money' => 10000, 'reward_xp' => 5000, 'reward_prestige_points' => 5, 'order' => 42],

            // Reputation Achievements
            ['key' => 'reputation_100', 'name' => 'Known Developer', 'description' => 'Reach 100 reputation', 'icon' => '⭐', 'category' => 'reputation', 'requirement_type' => 'reputation', 'requirement_value' => 100, 'reward_money' => 500, 'reward_xp' => 250, 'reward_prestige_points' => 0, 'order' => 50],
            ['key' => 'reputation_500', 'name' => 'Respected', 'description' => 'Reach 500 reputation', 'icon' => '🌟', 'category' => 'reputation', 'requirement_type' => 'reputation', 'requirement_value' => 500, 'reward_money' => 5000, 'reward_xp' => 2500, 'reward_prestige_points' => 2, 'order' => 51],
            ['key' => 'reputation_1000', 'name' => 'Industry Leader', 'description' => 'Reach 1000 reputation', 'icon' => '👑', 'category' => 'reputation', 'requirement_type' => 'reputation', 'requirement_value' => 1000, 'reward_money' => 20000, 'reward_xp' => 10000, 'reward_prestige_points' => 10, 'order' => 52],

            // Special Achievements
            ['key' => 'clicker_1000', 'name' => 'Click Master', 'description' => 'Click 1,000 times', 'icon' => '🖱️', 'category' => 'special', 'requirement_type' => 'clicks', 'requirement_value' => 1000, 'reward_money' => 1000, 'reward_xp' => 500, 'reward_prestige_points' => 1, 'order' => 60],
            ['key' => 'first_prestige', 'name' => 'Ascension', 'description' => 'Prestige for the first time', 'icon' => '✨', 'category' => 'special', 'requirement_type' => 'prestige', 'requirement_value' => 1, 'reward_money' => 0, 'reward_xp' => 0, 'reward_prestige_points' => 5, 'order' => 61],
        ];

        foreach ($achievements as $achievement) {
            Achievement::create($achievement);
        }

        $this->command->info('Created ' . count($achievements) . ' achievements!');
    }
}

