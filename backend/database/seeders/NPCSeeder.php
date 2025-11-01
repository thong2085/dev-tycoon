<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NPC;

class NPCSeeder extends Seeder
{
    public function run(): void
    {
        $npcs = [
            [
                'name' => 'Alex Chen',
                'role' => 'client',
                'description' => 'Tech startup founder looking for a reliable dev partner',
                'personality' => 'friendly',
                'background' => 'Founded 2 startups, loves clean code and fast delivery. Values honesty and communication.',
                'required_company_level' => 1,
            ],
            [
                'name' => 'Sarah Martinez',
                'role' => 'investor',
                'description' => 'Angel investor specializing in tech companies',
                'personality' => 'serious',
                'background' => 'Invested in 50+ companies, very analytical and data-driven. Looks for scalability and strong teams.',
                'required_company_level' => 5,
            ],
            [
                'name' => 'Marcus Johnson',
                'role' => 'mentor',
                'description' => 'Seasoned CTO with 20 years in the industry',
                'personality' => 'friendly',
                'background' => 'Built 3 tech companies from scratch. Loves sharing wisdom about team building and architecture decisions.',
                'required_company_level' => 3,
            ],
            [
                'name' => 'Luna Rodriguez',
                'role' => 'competitor',
                'description' => 'CEO of rival dev agency',
                'personality' => 'funny',
                'background' => 'Started same time as you, friendly rivalry. Shares tips but loves winning contracts over you!',
                'required_company_level' => 2,
            ],
            [
                'name' => 'Dr. Priya Patel',
                'role' => 'mentor',
                'description' => 'Product management expert and business strategist',
                'personality' => 'friendly',
                'background' => 'Led product at 5 unicorns. Expert in user research, growth strategy, and agile development.',
                'required_company_level' => 4,
            ],
            [
                'name' => 'CryptoKing',
                'role' => 'client',
                'description' => 'Cryptocurrency project owner seeking blockchain devs',
                'personality' => 'strict',
                'background' => 'Made millions from crypto, very demanding. Wants everything done yesterday with 100% security.',
                'required_company_level' => 6,
            ],
            [
                'name' => 'Grandma Betty',
                'role' => 'client',
                'description' => 'Retired teacher wants to build a recipe-sharing website',
                'personality' => 'funny',
                'background' => 'Tech novice but super enthusiastic! Loves chatting, provides homemade cookies as bonuses.',
                'required_company_level' => 1,
            ],
        ];

        foreach ($npcs as $npc) {
            NPC::firstOrCreate(
                ['name' => $npc['name']],
                $npc
            );
        }
    }
}
