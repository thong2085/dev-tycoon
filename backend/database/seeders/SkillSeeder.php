<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Skill;

class SkillSeeder extends Seeder
{
    public function run(): void
    {
        $skills = [
            // Frontend Skills
            [
                'name' => 'HTML',
                'category' => 'Frontend',
                'description' => 'Master of web structure and markup',
                'icon' => '📄',
                'base_unlock_cost' => 50,
                'upgrade_multiplier' => 1.3,
                'max_level' => 10,
                'project_types' => ['Landing Page', 'Business Website', 'E-commerce Store'],
                'efficiency_bonus' => 0.08,
            ],
            [
                'name' => 'CSS',
                'category' => 'Frontend',
                'description' => 'Style guru - make things beautiful',
                'icon' => '🎨',
                'base_unlock_cost' => 75,
                'upgrade_multiplier' => 1.3,
                'max_level' => 10,
                'project_types' => ['Landing Page', 'Business Website', 'E-commerce Store'],
                'efficiency_bonus' => 0.08,
            ],
            [
                'name' => 'JavaScript',
                'category' => 'Frontend',
                'description' => 'Make websites interactive and dynamic',
                'icon' => '⚡',
                'base_unlock_cost' => 150,
                'upgrade_multiplier' => 1.4,
                'max_level' => 10,
                'project_types' => ['Business Website', 'E-commerce Store', 'Interactive Game'],
                'efficiency_bonus' => 0.10,
            ],
            [
                'name' => 'React',
                'category' => 'Frontend',
                'description' => 'Build modern SPAs with ease',
                'icon' => '⚛️',
                'base_unlock_cost' => 300,
                'upgrade_multiplier' => 1.5,
                'max_level' => 10,
                'project_types' => ['SaaS Platform', 'Interactive Game', 'Mobile App'],
                'efficiency_bonus' => 0.12,
            ],
            [
                'name' => 'Vue.js',
                'category' => 'Frontend',
                'description' => 'Progressive framework for UI',
                'icon' => '💚',
                'base_unlock_cost' => 300,
                'upgrade_multiplier' => 1.5,
                'max_level' => 10,
                'project_types' => ['SaaS Platform', 'Business Website', 'E-commerce Store'],
                'efficiency_bonus' => 0.12,
            ],
            
            // Backend Skills
            [
                'name' => 'PHP',
                'category' => 'Backend',
                'description' => 'Server-side scripting language',
                'icon' => '🐘',
                'base_unlock_cost' => 100,
                'upgrade_multiplier' => 1.3,
                'max_level' => 10,
                'project_types' => ['Business Website', 'E-commerce Store'],
                'efficiency_bonus' => 0.09,
            ],
            [
                'name' => 'Laravel',
                'category' => 'Backend',
                'description' => 'Modern PHP framework for web artisans',
                'icon' => '🔺',
                'base_unlock_cost' => 350,
                'upgrade_multiplier' => 1.5,
                'max_level' => 10,
                'project_types' => ['E-commerce Store', 'SaaS Platform'],
                'efficiency_bonus' => 0.13,
            ],
            [
                'name' => 'Node.js',
                'category' => 'Backend',
                'description' => 'JavaScript on the server',
                'icon' => '🟢',
                'base_unlock_cost' => 250,
                'upgrade_multiplier' => 1.4,
                'max_level' => 10,
                'project_types' => ['SaaS Platform', 'Interactive Game'],
                'efficiency_bonus' => 0.11,
            ],
            [
                'name' => 'Python',
                'category' => 'Backend',
                'description' => 'Versatile language for web and AI',
                'icon' => '🐍',
                'base_unlock_cost' => 200,
                'upgrade_multiplier' => 1.4,
                'max_level' => 10,
                'project_types' => ['SaaS Platform'],
                'efficiency_bonus' => 0.10,
            ],
            
            // Database Skills
            [
                'name' => 'MySQL',
                'category' => 'Database',
                'description' => 'Relational database management',
                'icon' => '🗄️',
                'base_unlock_cost' => 150,
                'upgrade_multiplier' => 1.3,
                'max_level' => 10,
                'project_types' => ['E-commerce Store', 'SaaS Platform', 'Business Website'],
                'efficiency_bonus' => 0.09,
            ],
            [
                'name' => 'MongoDB',
                'category' => 'Database',
                'description' => 'NoSQL document database',
                'icon' => '🍃',
                'base_unlock_cost' => 200,
                'upgrade_multiplier' => 1.4,
                'max_level' => 10,
                'project_types' => ['SaaS Platform', 'Interactive Game'],
                'efficiency_bonus' => 0.10,
            ],
            
            // Mobile Skills
            [
                'name' => 'React Native',
                'category' => 'Mobile',
                'description' => 'Build native apps with React',
                'icon' => '📱',
                'base_unlock_cost' => 500,
                'upgrade_multiplier' => 1.6,
                'max_level' => 10,
                'project_types' => ['Mobile App'],
                'efficiency_bonus' => 0.15,
            ],
            [
                'name' => 'Flutter',
                'category' => 'Mobile',
                'description' => 'Cross-platform mobile development',
                'icon' => '🦋',
                'base_unlock_cost' => 500,
                'upgrade_multiplier' => 1.6,
                'max_level' => 10,
                'project_types' => ['Mobile App'],
                'efficiency_bonus' => 0.15,
            ],
            
            // DevOps Skills
            [
                'name' => 'Docker',
                'category' => 'DevOps',
                'description' => 'Containerize your applications',
                'icon' => '🐳',
                'base_unlock_cost' => 400,
                'upgrade_multiplier' => 1.5,
                'max_level' => 10,
                'project_types' => ['SaaS Platform'],
                'efficiency_bonus' => 0.10,
            ],
            [
                'name' => 'AWS',
                'category' => 'DevOps',
                'description' => 'Cloud infrastructure expertise',
                'icon' => '☁️',
                'base_unlock_cost' => 600,
                'upgrade_multiplier' => 1.6,
                'max_level' => 10,
                'project_types' => ['SaaS Platform'],
                'efficiency_bonus' => 0.12,
            ],
            
            // AI/ML Skills
            [
                'name' => 'Machine Learning',
                'category' => 'AI',
                'description' => 'Teach machines to learn',
                'icon' => '🤖',
                'base_unlock_cost' => 1000,
                'upgrade_multiplier' => 1.7,
                'max_level' => 10,
                'project_types' => ['SaaS Platform'],
                'efficiency_bonus' => 0.18,
            ],
            [
                'name' => 'TensorFlow',
                'category' => 'AI',
                'description' => 'Deep learning framework',
                'icon' => '🧠',
                'base_unlock_cost' => 1200,
                'upgrade_multiplier' => 1.8,
                'max_level' => 10,
                'project_types' => ['SaaS Platform'],
                'efficiency_bonus' => 0.20,
            ],
        ];

        foreach ($skills as $skill) {
            Skill::create($skill);
        }
    }
}

