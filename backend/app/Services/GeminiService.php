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
            $text = trim($response['candidates'][0]['content']['parts'][0]['text']);
            return empty($text) ? null : $text;
        }
        
        // Fallback: check for blocked content or errors
        if (isset($response['candidates'][0]['finishReason'])) {
            $reason = $response['candidates'][0]['finishReason'];
            if ($reason === 'SAFETY' || $reason === 'RECITATION') {
                Log::warning('Gemini response blocked', ['reason' => $reason]);
                return null;
            }
        }
        
        Log::warning('Unexpected Gemini response structure', ['response' => $response]);
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

    /**
     * Chat with AI Mentor using conversation history
     */
    public function chat(array $conversationHistory, array $gameContext = []): ?string
    {
        // Build system prompt for AI Mentor role
        $systemPrompt = "You are an experienced Tech Mentor in 'Dev Tycoon', a game where players run a software development company.
        
Your role: Provide helpful, friendly advice on:
- Career growth and productivity tips
- Coding best practices
- Team management strategies
- Company building insights
- Balancing work-life (with humor!)

Conversation style: Professional but approachable, use real-world examples, keep responses concise (2-3 sentences max).";

        // Build context prompt if game state is provided
        $contextPrompt = '';
        if (!empty($gameContext)) {
            $contextPrompt = "\n\nCurrent Game Context:\n";
            if (isset($gameContext['level'])) {
                $contextPrompt .= "- Player Level: {$gameContext['level']}\n";
            }
            if (isset($gameContext['company_level'])) {
                $contextPrompt .= "- Company Level: {$gameContext['company_level']}\n";
            }
            if (isset($gameContext['reputation'])) {
                $contextPrompt .= "- Reputation: {$gameContext['reputation']}\n";
            }
            if (isset($gameContext['employees_count'])) {
                $contextPrompt .= "- Employees: {$gameContext['employees_count']}\n";
            }
            if (isset($gameContext['products_count'])) {
                $contextPrompt .= "- Products: {$gameContext['products_count']}\n";
            }
        }

        // Build conversation contents array
        $contents = [];
        
        // Add system instruction as first message
        $contents[] = [
            'parts' => [
                ['text' => $systemPrompt . $contextPrompt]
            ]
        ];

        // Add conversation history
        foreach ($conversationHistory as $msg) {
            $contents[] = [
                'role' => $msg['role'],
                'parts' => [
                    ['text' => $msg['message']]
                ]
            ];
        }

        try {
            $url = "{$this->apiUrl}/{$this->model}:generateContent?key={$this->apiKey}";

            $response = $this->client->post($url, [
                'json' => [
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.8, // More creative/conversational
                        'maxOutputTokens' => 500, // Keep responses concise
                    ]
                ],
                'headers' => [
                    'Content-Type' => 'application/json',
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            // Extract AI response
            return $this->extractText($data);
        } catch (GuzzleException $e) {
            Log::error('Gemini Chat API Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Chat with NPC using conversation history
     */
    public function chatWithNPC(array $npcData, array $conversationHistory, array $gameContext = []): ?string
    {
        // Build system prompt for NPC role
        $systemPrompt = "You are {$npcData['name']}, a {$npcData['role']} in 'Dev Tycoon', a game where players run a software development company.

Role: {$npcData['role']}
Description: {$npcData['description']}
Personality: {$npcData['personality']}
Background: {$npcData['background']}

Conversation guidelines:
- Stay IN CHARACTER as this NPC
- Match their personality ({$npcData['personality']})
- Keep responses concise (1-3 sentences max)
- Be engaging and dynamic
- Reference your role and background naturally
- You can communicate in ANY language the player uses (English, Vietnamese, etc.)
- Always respond helpfully and stay in character
- If asked about tasks or quests, mention that you can offer quests if they request one";

        // Build context prompt if game state is provided
        $contextPrompt = '';
        if (!empty($gameContext)) {
            $contextPrompt = "\n\nCurrent Player Context:\n";
            if (isset($gameContext['level'])) {
                $contextPrompt .= "- Player Level: {$gameContext['level']}\n";
            }
            if (isset($gameContext['company_level'])) {
                $contextPrompt .= "- Company Level: {$gameContext['company_level']}\n";
            }
            if (isset($gameContext['reputation'])) {
                $contextPrompt .= "- Reputation: {$gameContext['reputation']}\n";
            }
            if (isset($gameContext['company_name'])) {
                $contextPrompt .= "- Company Name: {$gameContext['company_name']}\n";
            }
        }

        // Build conversation contents array
        $contents = [];
        
        // Add system instruction as first message
        $contents[] = [
            'parts' => [
                ['text' => $systemPrompt . $contextPrompt]
            ]
        ];

        // Add conversation history
        foreach ($conversationHistory as $msg) {
            $contents[] = [
                'role' => $msg['role'] === 'user' ? 'user' : 'model',
                'parts' => [
                    ['text' => $msg['message']]
                ]
            ];
        }

        try {
            $url = "{$this->apiUrl}/{$this->model}:generateContent?key={$this->apiKey}";

            $response = $this->client->post($url, [
                'json' => [
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.9, // More creative for NPCs
                        'maxOutputTokens' => 300, // Shorter responses
                    ],
                    'safetySettings' => [
                        [
                            'category' => 'HARM_CATEGORY_HARASSMENT',
                            'threshold' => 'BLOCK_ONLY_HIGH'
                        ],
                        [
                            'category' => 'HARM_CATEGORY_HATE_SPEECH',
                            'threshold' => 'BLOCK_ONLY_HIGH'
                        ],
                        [
                            'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            'threshold' => 'BLOCK_ONLY_HIGH'
                        ],
                        [
                            'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            'threshold' => 'BLOCK_ONLY_HIGH'
                        ]
                    ]
                ],
                'headers' => [
                    'Content-Type' => 'application/json',
                ]
            ]);

            $responseBody = $response->getBody()->getContents();
            $data = json_decode($responseBody, true);
            
            // Log response for debugging
            if (isset($data['candidates'][0]['finishReason'])) {
                Log::info('Gemini NPC Response', [
                    'finishReason' => $data['candidates'][0]['finishReason'],
                    'npc' => $npcData['name']
                ]);
            }
            
            // Extract AI response
            $aiResponse = $this->extractText($data);
            
            // If blocked or empty, provide fallback response
            if (!$aiResponse) {
                $fallbackResponses = [
                    'friendly' => "I'd love to help! Let me think about that...",
                    'serious' => "I understand. Let me consider how we can proceed.",
                    'funny' => "Hmm, that's interesting! Let me process that...",
                    'strict' => "Understood. I'll need to review this carefully.",
                ];
                
                $personality = $npcData['personality'] ?? 'friendly';
                return $fallbackResponses[$personality] ?? $fallbackResponses['friendly'];
            }
            
            return $aiResponse;
        } catch (GuzzleException $e) {
            Log::error('Gemini NPC Chat API Error', [
                'message' => $e->getMessage(),
                'npc' => $npcData['name'] ?? 'Unknown',
                'trace' => $e->getTraceAsString()
            ]);
            
            // Provide fallback response on error
            $personality = $npcData['personality'] ?? 'friendly';
            $fallbackResponses = [
                'friendly' => "I'm having trouble connecting right now, but I'm here to help!",
                'serious' => "There seems to be a technical issue. Please try again.",
                'funny' => "Oops! Something went wrong, but I'm still listening!",
                'strict' => "Technical error occurred. Retry when connection is stable.",
            ];
            
            return $fallbackResponses[$personality] ?? $fallbackResponses['friendly'];
        }
    }

    /**
     * Generate AI-powered market event
     */
    public function generateMarketEvent(): ?array
    {
        $prompt = "Generate a random market event for 'Dev Tycoon', a game where players run a software development company.

Generate a JSON object with these fields:
{
  \"event_type\": \"event_name\" (camelCase, unique identifier),
  \"description\": \"Short, engaging description (1-2 sentences)\",
  \"effect\": {
    \"type\": \"revenue|progress|cost|bonus\",
    \"value\": number (percentage as decimal, e.g. 0.5 for +50%, -0.3 for -30%)
  },
  \"duration_minutes\": number (5-15)
}

Event types should be realistic tech industry events like:
- market_boom, tech_crash, startup_bubble, ai_hype, data_breach, crypto_crash, talent_war, remote_boom, etc.

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
     * Generate AI-powered NPC quest
     */
    public function generateNPCQuest(array $npcData, array $gameContext): ?array
    {
        $role = $npcData['role'] ?? 'client';
        $personality = $npcData['personality'] ?? 'friendly';
        
        $prompt = "Generate a quest for 'Dev Tycoon' game. An NPC named {$npcData['name']} ({$role}, {$personality}) wants to offer a quest.

Game Context:
- Player Level: {$gameContext['level']}
- Company Level: {$gameContext['company_level']}
- Reputation: {$gameContext['reputation']}

Generate a JSON object with these fields:
{
  \"quest_type\": \"hire_employee|complete_project|launch_product|reach_level|earn_money|gain_reputation\",
  \"title\": \"Short, catchy quest title (4-6 words)\",
  \"description\": \"Detailed quest description explaining what {$npcData['name']} wants (2-3 sentences)\",
  \"requirements\": {
    \"target\": string (what to achieve, e.g. \"3 employees\", \"2 projects\", \"$50000\", \"Level 10\"),
    \"count\": number OR \"amount\": number
  },
  \"target_progress\": number (the count or amount needed),
  \"rewards\": {
    \"money\": number (reward amount),
    \"reputation\": number (optional, reputation boost),
    \"xp\": number (optional, experience points)
  }
}

Quest types based on NPC role:
- client: complete_project, reach_level, launch_product
- investor: earn_money, gain_reputation, launch_product
- mentor: reach_level, gain_reputation
- competitor: earn_money, complete_project

Make rewards proportional to difficulty. Be creative and match {$npcData['name']}'s personality.

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
}

