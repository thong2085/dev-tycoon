<?php

/**
 * Game Balance Configuration
 * 
 * This file contains all game balance values for costs, rewards, durations, etc.
 * Adjust these values to fine-tune game economy and pacing.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Employee Costs & Salaries
    |--------------------------------------------------------------------------
    */
    'employees' => [
        'hire_costs' => [
            'junior' => 1500,      // Increased from 1000
            'mid' => 3500,          // Increased from 2500
            'senior' => 7500,       // Increased from 5000
            'lead' => 15000,        // Increased from 10000
            'architect' => 30000,   // Increased from 20000
        ],
        'salary_multiplier' => 0.12, // Monthly salary = hire_cost * multiplier (changed from 0.10)
        'productivity' => [
            'junior' => 50,
            'mid' => 75,
            'senior' => 100,
            'lead' => 125,
            'architect' => 150,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Project Rewards & Costs
    |--------------------------------------------------------------------------
    */
    'projects' => [
        'reward_multiplier' => 150,  // reward = difficulty * multiplier (increased from 100)
        'deadline_hours_per_difficulty' => 3, // deadline = difficulty * hours (increased from 2)
        'quest_project_deadline_days' => 10,  // Increased from 7 days
        'base_required_reputation' => 0,      // Minimum reputation needed
        'reputation_per_difficulty' => 100,   // Additional rep per difficulty level
        'reputation_penalty_per_difficulty' => 5, // Reputation penalty when project fails (per difficulty level)
    ],

    /*
    |--------------------------------------------------------------------------
    | Product Revenue & Upkeep
    |--------------------------------------------------------------------------
    */
    'products' => [
        'revenue_percentage' => 0.12,  // base_monthly_revenue = project_reward * percentage (increased from 0.10)
        'upkeep_percentage' => 0.18,   // upkeep = base_monthly_revenue * percentage (decreased from 0.20)
        'growth_rate' => 0.025,        // Monthly growth rate (increased from 0.02 = 2.5%)
    ],

    /*
    |--------------------------------------------------------------------------
    | Quest System
    |--------------------------------------------------------------------------
    */
    'quests' => [
        'expiry_hours' => 48,  // Increased from 24 hours - more time to complete
        'expiry_reputation_penalty' => 2,  // Small reputation penalty when quest expires
        'rewards' => [
            'money_multiplier' => 1.2,     // Rewards are more generous
            'reputation_base' => 10,       // Base reputation reward
            'xp_base' => 100,              // Base XP reward
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Offline Income
    |--------------------------------------------------------------------------
    */
    'offline' => [
        'max_hours' => 12,  // Increased from 8 hours - reward players who return
    ],

    /*
    |--------------------------------------------------------------------------
    | Upgrade Costs
    |--------------------------------------------------------------------------
    */
    'upgrades' => [
        'base_cost_click_power' => 50,
        'base_cost_auto_income' => 100,
        'cost_multiplier' => 1.15,  // Each level costs 15% more
    ],

    /*
    |--------------------------------------------------------------------------
    | Company Level Progression
    |--------------------------------------------------------------------------
    */
    'company' => [
        'xp_per_project' => 50,           // XP gained per completed project
        'xp_per_product' => 100,          // XP gained per launched product
        'xp_per_employee' => 25,          // XP gained per hired employee
        'levels' => [
            1 => ['required_xp' => 0, 'max_employees' => 5],
            2 => ['required_xp' => 500, 'max_employees' => 8],
            3 => ['required_xp' => 1500, 'max_employees' => 12],
            4 => ['required_xp' => 3500, 'max_employees' => 18],
            5 => ['required_xp' => 7000, 'max_employees' => 25],
        ],
    ],
];

