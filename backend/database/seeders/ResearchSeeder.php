<?php

namespace Database\Seeders;

use App\Models\Research;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class ResearchSeeder extends Seeder
{
    public function run(): void
    {
        $researches = [
            // Product Researches
            [
                'key' => 'product_growth_boost',
                'name' => 'Product Growth Optimization',
                'description' => '+10% growth rate for all products',
                'category' => 'product',
                'cost' => 5000,
                'required_level' => 2,
                'effects' => ['product_growth_multiplier' => 0.1],
                'icon' => '📈',
            ],
            [
                'key' => 'upkeep_reduction',
                'name' => 'Cost Efficiency',
                'description' => '-10% upkeep costs for all products',
                'category' => 'product',
                'cost' => 7500,
                'required_level' => 3,
                'effects' => ['upkeep_reduction' => 0.1],
                'icon' => '💰',
            ],
            [
                'key' => 'product_revenue_boost',
                'name' => 'Revenue Enhancement',
                'description' => '+15% base monthly revenue for all products',
                'category' => 'product',
                'cost' => 10000,
                'required_level' => 4,
                'effects' => ['product_revenue_multiplier' => 0.15],
                'icon' => '💵',
            ],
            
            // Employee Researches
            [
                'key' => 'energy_regen_boost',
                'name' => 'Better Rest Facilities',
                'description' => '+1 energy per minute when idle',
                'category' => 'employee',
                'cost' => 3000,
                'required_level' => 2,
                'effects' => ['energy_regen_bonus' => 1],
                'icon' => '⚡',
            ],
            [
                'key' => 'morale_regen_boost',
                'name' => 'Team Building Programs',
                'description' => '+1 morale per minute when idle',
                'category' => 'employee',
                'cost' => 4000,
                'required_level' => 3,
                'effects' => ['morale_regen_bonus' => 1],
                'icon' => '😊',
            ],
            [
                'key' => 'productivity_boost',
                'name' => 'Training Programs',
                'description' => '+5 base productivity for all employees',
                'category' => 'employee',
                'cost' => 8000,
                'required_level' => 4,
                'effects' => ['productivity_bonus' => 5],
                'icon' => '🎓',
            ],
            
            // Project Researches
            [
                'key' => 'project_speed_boost',
                'name' => 'Project Management',
                'description' => '+5% project progress rate',
                'category' => 'project',
                'cost' => 6000,
                'required_level' => 2,
                'effects' => ['project_progress_multiplier' => 0.05],
                'icon' => '🚀',
            ],
            [
                'key' => 'project_reward_boost',
                'name' => 'Client Relations',
                'description' => '+10% project rewards',
                'category' => 'project',
                'cost' => 7000,
                'required_level' => 3,
                'effects' => ['project_reward_multiplier' => 0.1],
                'icon' => '🤝',
            ],
            
            // Company Researches
            [
                'key' => 'company_level_boost',
                'name' => 'Strategic Planning',
                'description' => 'Company level increases 20% faster',
                'category' => 'company',
                'cost' => 12000,
                'required_level' => 5,
                'effects' => ['company_level_multiplier' => 0.2],
                'icon' => '🏢',
            ],
        ];

        foreach ($researches as $research) {
            // Check if table has tech_name column and add it if needed
            $researchData = $research;
            if (Schema::hasColumn('researches', 'tech_name')) {
                $researchData['tech_name'] = $research['key'] ?? null;
            }
            if (Schema::hasColumn('researches', 'company_id')) {
                $researchData['company_id'] = null;
            }
            
            Research::firstOrCreate(
                ['key' => $research['key']],
                $researchData
            );
        }
    }
}

