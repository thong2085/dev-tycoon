<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected Client $client;
    protected string $apiKey;
    protected string $apiUrl;
    protected string $model;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 120.0,  // 2 minutes timeout for AI generation
            'connect_timeout' => 10.0,
        ]);
        $this->apiKey = config('gemini.api_key');
        $this->apiUrl = config('gemini.api_url');
        $this->model = config('gemini.model');
    }

    /**
     * Generate content using Gemini AI
     */
    public function generateContent(string $prompt, array $options = []): ?array
    {
        try {
            $url = "{$this->apiUrl}/{$this->model}:generateContent?key={$this->apiKey}";

            $response = $this->client->post($url, [
                'json' => [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => $options['temperature'] ?? config('gemini.temperature'),
                        'maxOutputTokens' => $options['max_tokens'] ?? config('gemini.max_tokens'),
                    ]
                ],
                'headers' => [
                    'Content-Type' => 'application/json',
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            return $data;
        } catch (GuzzleException $e) {
            Log::error('Gemini API Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Extract text from Gemini response
     */
    protected function extractText(array $response): ?string
    {
        if (isset($response['candidates'][0]['content']['parts'][0]['text'])) {
            return $response['candidates'][0]['content']['parts'][0]['text'];
        }
        return null;
    }

    /**
     * Generate random project using AI
     */
    public function generateProject(array $context = []): ?array
    {
        $difficulty = $context['difficulty'] ?? 'random';
        $category = $context['category'] ?? 'any';
        
        $prompt = "Generate a realistic software development project for a game called 'Dev Tycoon'.

Context:
- Difficulty level: {$difficulty} (beginner/intermediate/advanced)
- Category: {$category} (web/mobile/ai/blockchain/e-commerce)

Generate a JSON object with these fields:
{
  \"title\": \"Project title (creative and realistic)\",
  \"description\": \"Detailed description (2-3 sentences)\",
  \"difficulty\": \"beginner/intermediate/advanced\",
  \"base_reward\": number (500-5000 based on difficulty),
  \"duration_hours\": number (1-48 based on difficulty),
  \"required_reputation\": number (10-100 based on difficulty),
  \"required_skills\": [\"skill1\", \"skill2\"],
  \"project_type\": \"web/mobile/ai/blockchain/e-commerce\"
}

IMPORTANT: Return ONLY the JSON object, no other text.";

        $response = $this->generateContent($prompt);
        if (!$response) {
            return null;
        }

        $text = $this->extractText($response);
        if (!$text) {
            return null;
        }

        // Extract JSON from response
        $json = $this->extractJson($text);
        return $json;
    }

    /**
     * Generate new skill using AI
     */
    public function generateSkill(array $context = []): ?array
    {
        $category = $context['category'] ?? 'any';
        
        $prompt = "Generate a realistic tech skill/technology for a game called 'Dev Tycoon'.

Context:
- Category: {$category} (frontend/backend/mobile/devops/ai/design)

Generate a JSON object with these fields:
{
  \"name\": \"Technology/Skill name\",
  \"category\": \"frontend/backend/mobile/devops/ai/design\",
  \"description\": \"What this skill does (1-2 sentences)\",
  \"icon\": \"Single emoji that represents this skill\",
  \"base_unlock_cost\": number (1000-5000),
  \"upgrade_multiplier\": number (1.5-2.0),
  \"max_level\": number (5-20),
  \"efficiency_bonus\": number (0.05-0.15)
}

IMPORTANT: Return ONLY the JSON object, no other text.";

        $response = $this->generateContent($prompt);
        if (!$response) {
            return null;
        }

        $text = $this->extractText($response);
        if (!$text) {
            return null;
        }

        $json = $this->extractJson($text);
        return $json;
    }

    /**
     * Generate achievement using AI
     */
    public function generateAchievement(array $context = []): ?array
    {
        $category = $context['category'] ?? 'any';
        
        $prompt = "Generate a creative achievement for a game called 'Dev Tycoon' (a software developer simulator game).

Context:
- Category: {$category} (money/projects/skills/employees/prestige/special)

Generate a JSON object with these fields:
{
  \"key\": \"snake_case_unique_key\",
  \"name\": \"Achievement Name\",
  \"description\": \"What player needs to do\",
  \"category\": \"money/projects/skills/employees/prestige/special\",
  \"icon\": \"Single emoji\",
  \"requirement_type\": \"total_money/projects_completed/skills_unlocked/employees_hired/prestige_level/custom\",
  \"requirement_value\": number,
  \"reward_money\": number (100-10000),
  \"reward_reputation\": number (10-100)
}

IMPORTANT: Return ONLY the JSON object, no other text.";

        $response = $this->generateContent($prompt);
        if (!$response) {
            return null;
        }

        $text = $this->extractText($response);
        if (!$text) {
            return null;
        }

        $json = $this->extractJson($text);
        return $json;
    }

    /**
     * Generate multiple projects with retry logic
     */
    public function generateProjects(int $count = 5, array $context = []): array
    {
        $projects = [];
        for ($i = 0; $i < $count; $i++) {
            // Try up to 3 times for each project
            $maxRetries = 3;
            $project = null;
            
            for ($retry = 0; $retry < $maxRetries; $retry++) {
                $project = $this->generateProject($context);
                if ($project) {
                    break; // Success, stop retrying
                }
                
                // Wait before retry (exponential backoff)
                if ($retry < $maxRetries - 1) {
                    usleep(1000000 * ($retry + 1)); // 1s, 2s, 3s
                    Log::warning("Retrying project generation (attempt " . ($retry + 2) . "/$maxRetries)");
                }
            }
            
            if ($project) {
                $projects[] = $project;
            } else {
                Log::error("Failed to generate project after $maxRetries attempts (project " . ($i + 1) . "/$count)");
            }
            
            // Delay between successful generations to avoid rate limiting
            if ($i < $count - 1) {
                usleep(800000); // 0.8 second
            }
        }
        return $projects;
    }

    /**
     * Generate multiple skills with retry logic
     */
    public function generateSkills(int $count = 5, array $context = []): array
    {
        $skills = [];
        for ($i = 0; $i < $count; $i++) {
            $maxRetries = 3;
            $skill = null;
            
            for ($retry = 0; $retry < $maxRetries; $retry++) {
                $skill = $this->generateSkill($context);
                if ($skill) {
                    break;
                }
                if ($retry < $maxRetries - 1) {
                    usleep(1000000 * ($retry + 1));
                    Log::warning("Retrying skill generation (attempt " . ($retry + 2) . "/$maxRetries)");
                }
            }
            
            if ($skill) {
                $skills[] = $skill;
            } else {
                Log::error("Failed to generate skill after $maxRetries attempts (skill " . ($i + 1) . "/$count)");
            }
            
            if ($i < $count - 1) {
                usleep(800000);
            }
        }
        return $skills;
    }

    /**
     * Generate multiple achievements with retry logic
     */
    public function generateAchievements(int $count = 5, array $context = []): array
    {
        $achievements = [];
        for ($i = 0; $i < $count; $i++) {
            $maxRetries = 3;
            $achievement = null;
            
            for ($retry = 0; $retry < $maxRetries; $retry++) {
                $achievement = $this->generateAchievement($context);
                if ($achievement) {
                    break;
                }
                if ($retry < $maxRetries - 1) {
                    usleep(1000000 * ($retry + 1));
                    Log::warning("Retrying achievement generation (attempt " . ($retry + 2) . "/$maxRetries)");
                }
            }
            
            if ($achievement) {
                $achievements[] = $achievement;
            } else {
                Log::error("Failed to generate achievement after $maxRetries attempts (achievement " . ($i + 1) . "/$count)");
            }
            
            if ($i < $count - 1) {
                usleep(800000);
            }
        }
        return $achievements;
    }

    /**
     * Generate employee name
     */
    public function generateEmployeeName(array $context = []): ?string
    {
        $role = $context['role'] ?? 'Software Developer';
        $nationality = $context['nationality'] ?? 'any';
        
        $prompt = "Generate a single realistic employee name for a game called 'Dev Tycoon'.

Context:
- Role: {$role}
- Nationality: {$nationality}

Generate a JSON object with:
{
  \"name\": \"Full Name (realistic, professional)\"
}

IMPORTANT: Return ONLY the JSON object, no other text.";

        $response = $this->generateContent($prompt);
        if (!$response) {
            return null;
        }

        $text = $this->extractText($response);
        if (!$text) {
            return null;
        }

        $json = $this->extractJson($text);
        return $json['name'] ?? null;
    }

    /**
     * Generate multiple employee names
     */
    public function generateEmployeeNames(int $count = 5, array $context = []): array
    {
        $names = [];
        for ($i = 0; $i < $count; $i++) {
            $name = $this->generateEmployeeName($context);
            if ($name) {
                $names[] = $name;
            }
            usleep(300000); // 0.3 second
        }
        return $names;
    }

    /**
     * Generate company name
     */
    public function generateCompanyName(array $context = []): ?string
    {
        $industry = $context['industry'] ?? 'Software Development';
        $style = $context['style'] ?? 'modern';
        
        $prompt = "Generate a single creative company name for a game called 'Dev Tycoon'.

Context:
- Industry: {$industry}
- Style: {$style} (modern/professional/creative/fun)

Generate a JSON object with:
{
  \"name\": \"Company Name (creative, memorable, professional)\"
}

IMPORTANT: Return ONLY the JSON object, no other text.";

        $response = $this->generateContent($prompt);
        if (!$response) {
            return null;
        }

        $text = $this->extractText($response);
        if (!$text) {
            return null;
        }

        $json = $this->extractJson($text);
        return $json['name'] ?? null;
    }

    /**
     * Generate multiple company names
     */
    public function generateCompanyNames(int $count = 5, array $context = []): array
    {
        $names = [];
        for ($i = 0; $i < $count; $i++) {
            $name = $this->generateCompanyName($context);
            if ($name) {
                $names[] = $name;
            }
            usleep(300000); // 0.3 second
        }
        return $names;
    }

    /**
     * Extract JSON from text (handles markdown code blocks)
     */
    protected function extractJson(string $text): ?array
    {
        // Remove markdown code blocks if present
        $text = preg_replace('/```json\s*/i', '', $text);
        $text = preg_replace('/```\s*$/i', '', $text);
        $text = trim($text);

        try {
            $json = json_decode($text, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $json;
            }
        } catch (\Exception $e) {
            Log::error('JSON Parse Error: ' . $e->getMessage());
        }

        return null;
    }
}

