<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Skill;
use App\Models\Achievement;
use App\Models\Company;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AIController extends Controller
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Generate AI project(s)
     */
    public function generateProjects(Request $request)
    {
        // Increase execution time for AI generation
        set_time_limit(180); // 3 minutes

        $count = $request->input('count', 1);
        $count = min($count, 10); // Max 10 at once
        
        $context = [
            'difficulty' => $request->input('difficulty', 'random'),
            'category' => $request->input('category', 'any'),
        ];

        $projects = $count > 1 
            ? $this->gemini->generateProjects($count, $context)
            : [$this->gemini->generateProject($context)];

        $projects = array_filter($projects); // Remove nulls
        $actualCount = count($projects);
        $requestedCount = $count;

        return response()->json([
            'success' => true,
            'count' => $actualCount,
            'requested' => $requestedCount,
            'projects' => $projects,
            'warning' => $actualCount < $requestedCount 
                ? "Only generated $actualCount out of $requestedCount projects (some API calls failed, check logs)"
                : null,
        ]);
    }

    /**
     * Save AI-generated project to database (from frontend)
     */
    public function createProject(Request $request)
    {
        $user = $request->user();
        
        // Map difficulty to integer (1-10)
        $difficultyMap = [
            'beginner' => rand(1, 3),
            'intermediate' => rand(4, 7),
            'advanced' => rand(8, 10),
        ];
        $difficulty = is_string($request->input('difficulty'))
            ? $difficultyMap[$request->input('difficulty')] ?? 5
            : $request->input('difficulty', 5);
        
        // Use required_reputation from AI, or calculate if not provided
        $requiredReputation = $request->input('required_reputation')
            ?? max(0, ($difficulty - 1) * 100);

        // Create project in GLOBAL job board (user_id = NULL)
        // Players can accept from "Browse Jobs"
        $project = Project::create([
            'user_id' => null,  // NULL = Available for all players
            'company_id' => null,  // NULL = Not assigned to any company yet
            'title' => $request->input('title'),
            'description' => $request->input('description', ''),
            'difficulty' => $difficulty,
            'required_reputation' => $requiredReputation,  // Now uses AI value!
            'reward' => $request->input('base_reward', 1000),
            'status' => 'available',
            'progress' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'AI-generated project saved to job board!',
            'project' => $project,
        ]);
    }

    /**
     * Generate AI skill(s)
     */
    public function generateSkills(Request $request)
    {
        set_time_limit(180); // 3 minutes

        $count = $request->input('count', 1);
        $count = min($count, 10);
        
        $context = [
            'category' => $request->input('category', 'any'),
        ];

        $skills = $count > 1 
            ? $this->gemini->generateSkills($count, $context)
            : [$this->gemini->generateSkill($context)];

        $skills = array_filter($skills);
        $actualCount = count($skills);
        $requestedCount = $count;

        return response()->json([
            'success' => true,
            'count' => $actualCount,
            'requested' => $requestedCount,
            'skills' => $skills,
            'warning' => $actualCount < $requestedCount 
                ? "Only generated $actualCount out of $requestedCount skills (some API calls failed, check logs)"
                : null,
        ]);
    }

    /**
     * Generate and save AI skill to database
     */
    public function createSkill(Request $request)
    {
        $context = [
            'category' => $request->input('category', 'any'),
        ];

        $generated = $this->gemini->generateSkill($context);
        
        if (!$generated) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate skill from AI',
            ], 500);
        }

        // Create skill in database
        $skill = Skill::create([
            'name' => $generated['name'],
            'category' => $generated['category'] ?? 'frontend',
            'description' => $generated['description'] ?? '',
            'icon' => $generated['icon'] ?? '💻',
            'base_unlock_cost' => $generated['base_unlock_cost'] ?? 2000,
            'upgrade_multiplier' => $generated['upgrade_multiplier'] ?? 1.5,
            'max_level' => $generated['max_level'] ?? 10,
            'efficiency_bonus' => $generated['efficiency_bonus'] ?? 0.1,
            'project_types' => $generated['project_types'] ?? [],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'AI-generated skill created!',
            'skill' => $skill,
        ]);
    }

    /**
     * Generate AI achievement(s)
     */
    public function generateAchievements(Request $request)
    {
        set_time_limit(180); // 3 minutes

        $count = $request->input('count', 1);
        $count = min($count, 10);
        
        $context = [
            'category' => $request->input('category', 'any'),
        ];

        $achievements = $count > 1 
            ? $this->gemini->generateAchievements($count, $context)
            : [$this->gemini->generateAchievement($context)];

        $achievements = array_filter($achievements);
        $actualCount = count($achievements);
        $requestedCount = $count;

        return response()->json([
            'success' => true,
            'count' => $actualCount,
            'requested' => $requestedCount,
            'achievements' => $achievements,
            'warning' => $actualCount < $requestedCount 
                ? "Only generated $actualCount out of $requestedCount achievements (some API calls failed, check logs)"
                : null,
        ]);
    }

    /**
     * Generate and save AI achievement to database
     */
    public function createAchievement(Request $request)
    {
        $context = [
            'category' => $request->input('category', 'any'),
        ];

        $generated = $this->gemini->generateAchievement($context);
        
        if (!$generated) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate achievement from AI',
            ], 500);
        }

        // Create achievement in database
        $achievement = Achievement::create([
            'key' => $generated['key'] ?? Str::slug($generated['name']),
            'name' => $generated['name'],
            'description' => $generated['description'] ?? '',
            'category' => $generated['category'] ?? 'special',
            'icon' => $generated['icon'] ?? '🏆',
            'requirement_type' => $generated['requirement_type'] ?? 'custom',
            'requirement_value' => $generated['requirement_value'] ?? 1,
            'reward_money' => $generated['reward_money'] ?? 1000,
            'reward_reputation' => $generated['reward_reputation'] ?? 50,
            'order' => Achievement::max('order') + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'AI-generated achievement created!',
            'achievement' => $achievement,
        ]);
    }

    /**
     * Generate employee names
     */
    public function generateEmployeeNames(Request $request)
    {
        set_time_limit(180); // 3 minutes

        $count = $request->input('count', 5);
        $count = min($count, 10);
        
        $context = [
            'role' => $request->input('role', 'Software Developer'),
            'nationality' => $request->input('nationality', 'any'),
        ];

        $names = $this->gemini->generateEmployeeNames($count, $context);

        return response()->json([
            'success' => true,
            'count' => count($names),
            'names' => $names,
        ]);
    }

    /**
     * Generate company names
     */
    public function generateCompanyNames(Request $request)
    {
        set_time_limit(180); // 3 minutes

        $count = $request->input('count', 5);
        $count = min($count, 10);
        
        $context = [
            'industry' => $request->input('industry', 'Software Development'),
            'style' => $request->input('style', 'modern'),
        ];

        $names = $this->gemini->generateCompanyNames($count, $context);

        return response()->json([
            'success' => true,
            'count' => count($names),
            'names' => $names,
        ]);
    }

    /**
     * Test Gemini API connection
     */
    public function testConnection(Request $request)
    {
        $response = $this->gemini->generateContent('Say "Hello from Gemini AI!" in a fun way.');
        
        if ($response) {
            return response()->json([
                'success' => true,
                'message' => 'Gemini API connected successfully!',
                'response' => $response,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to connect to Gemini API',
        ], 500);
    }
}

