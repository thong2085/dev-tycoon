<?php

namespace App\Http\Controllers;

use App\Models\NPC;
use App\Models\NpcConversation;
use App\Models\NPCQuest;
use App\Models\Project;
use App\Models\Company;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NPCController extends Controller
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Get all NPCs available to the user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->first();
        $companyLevel = $company?->company_level ?? 0;

        $npcs = NPC::where('required_company_level', '<=', $companyLevel)
            ->orderBy('required_company_level')
            ->get();

        return response()->json([
            'success' => true,
            'npcs' => $npcs,
        ]);
    }

    /**
     * Get conversation history with a specific NPC
     */
    public function getConversation(Request $request, $npcId)
    {
        $user = $request->user();
        
        $npc = NPC::findOrFail($npcId);
        
        $messages = NpcConversation::where('user_id', $user->id)
            ->where('npc_id', $npcId)
            ->orderBy('created_at', 'asc')
            ->get(['id', 'role', 'message', 'created_at']);

        // Get active quests for this NPC
        $activeQuests = NPCQuest::with('requiredProject:id,title,description,status,progress')
            ->where('user_id', $user->id)
            ->where('npc_id', $npcId)
            ->where('status', 'active')
            ->get();

        return response()->json([
            'success' => true,
            'npc' => $npc,
            'messages' => $messages,
            'active_quests' => $activeQuests,
        ]);
    }

    /**
     * Send a message to an NPC
     */
    public function sendMessage(Request $request, $npcId)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $user = $request->user();
        $message = $request->message;

        $npc = NPC::findOrFail($npcId);

        // Get conversation history BEFORE saving new message (last 15 messages for context)
        $conversationHistory = NpcConversation::where('user_id', $user->id)
            ->where('npc_id', $npcId)
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get(['role', 'message'])
            ->reverse()
            ->values()
            ->toArray();

        // Save user message to database
        $userMessage = NpcConversation::create([
            'user_id' => $user->id,
            'npc_id' => $npcId,
            'role' => 'user',
            'message' => $message,
        ]);

        // Get game context for personalized responses
        $gameState = $user->gameState;
        $company = $user->companies()->first();
        
        $gameContext = [];
        if ($gameState) {
            $gameContext['level'] = $gameState->level;
            $gameContext['reputation'] = $gameState->reputation ?? 0;
        }
        if ($company) {
            $gameContext['company_level'] = $company->company_level;
            $gameContext['company_name'] = $company->name;
        }

        // Get NPC data
        $npcData = [
            'name' => $npc->name,
            'role' => $npc->role,
            'description' => $npc->description,
            'personality' => $npc->personality,
            'background' => $npc->background,
        ];

        // Get AI response (now includes fallback responses)
        $aiResponse = $this->gemini->chatWithNPC($npcData, $conversationHistory, $gameContext);

        // Service now always returns a response (even if fallback), but double-check
        if (!$aiResponse || trim($aiResponse) === '') {
            // Ultimate fallback - should rarely reach here
            $aiResponse = match($npc->personality) {
                'friendly' => "Hello! I'm here to help. Feel free to ask me anything!",
                'serious' => "I'm listening. How can I assist you today?",
                'funny' => "Hey there! What's on your mind? 😊",
                'strict' => "State your request clearly and I'll assist.",
                default => "I'm ready to help. What would you like to know?",
            };
        }

        // Save NPC response to database
        $npcMessage = NpcConversation::create([
            'user_id' => $user->id,
            'npc_id' => $npcId,
            'role' => 'npc',
            'message' => $aiResponse,
        ]);

        return response()->json([
            'success' => true,
            'user_message' => $userMessage,
            'npc_message' => $npcMessage,
        ]);
    }

    /**
     * Clear conversation history with an NPC
     */
    public function clearConversation(Request $request, $npcId)
    {
        $user = $request->user();
        
        NpcConversation::where('user_id', $user->id)
            ->where('npc_id', $npcId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation history cleared',
        ]);
    }

    /**
     * Request a quest from an NPC
     */
    public function requestQuest(Request $request, $npcId)
    {
        $user = $request->user();
        $npc = NPC::findOrFail($npcId);

        // Check if NPC can give quests
        if (!$npc->can_give_quests) {
            return response()->json([
                'success' => false,
                'message' => 'This NPC does not offer quests.',
            ], 403);
        }

        // Check if player already has an active quest from this NPC
        $existingQuest = NPCQuest::where('user_id', $user->id)
            ->where('npc_id', $npcId)
            ->where('status', 'active')
            ->first();

        if ($existingQuest) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active quest from this NPC.',
                'existing_quest' => $existingQuest,
            ], 409);
        }

        // Get game context
        $gameState = $user->gameState;
        $company = $user->companies()->first();
        
        $gameContext = [
            'level' => $gameState ? $gameState->level : 1,
            'reputation' => $gameState ? ($gameState->reputation ?? 0) : 0,
            'company_level' => $company ? $company->company_level : 1,
        ];

        // Generate quest using AI
        $npcData = [
            'name' => $npc->name,
            'role' => $npc->role,
            'description' => $npc->description,
            'personality' => $npc->personality,
            'background' => $npc->background,
        ];

        $aiQuest = $this->gemini->generateNPCQuest($npcData, $gameContext);

        if (!$aiQuest) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate quest. Please try again.',
            ], 500);
        }

        $requiredProjectId = null;

        // If quest requires completing a project OR launching a product, create a specific project for this quest
        $questType = $aiQuest['quest_type'] ?? 'complete_project';
        if ($questType === 'complete_project' || $questType === 'launch_product') {
            $company = $user->companies()->first();
            if (!$company) {
                $company = Company::create([
                    'user_id' => $user->id,
                    'name' => $user->name . "'s Company",
                    'company_level' => 1,
                    'cash' => 0,
                    'monthly_revenue' => 0,
                    'monthly_costs' => 0,
                ]);
            }

            // Generate project based on quest description and NPC context
            $gameState = $user->gameState;
            $projectContext = [
                'difficulty' => 'intermediate', // Default for quests
                'category' => 'any',
            ];
            
            // Adjust difficulty based on player level
            if ($gameState && $gameState->level > 10) {
                $projectContext['difficulty'] = 'advanced';
            } elseif ($gameState && $gameState->level < 5) {
                $projectContext['difficulty'] = 'beginner';
            }

            $aiProject = $this->gemini->generateProject($projectContext);
            
            if ($aiProject) {
                // Map difficulty string to integer (1-10)
                $difficultyMap = [
                    'beginner' => rand(1, 3),
                    'intermediate' => rand(4, 7),
                    'advanced' => rand(8, 10),
                ];
                $difficultyString = $aiProject['difficulty'] ?? 'intermediate';
                $difficulty = is_string($difficultyString) && isset($difficultyMap[$difficultyString])
                    ? $difficultyMap[$difficultyString]
                    : (is_numeric($difficultyString) ? (int)$difficultyString : 5);
                
                // Create project for this quest
                $project = Project::create([
                    'user_id' => $user->id,
                    'company_id' => $company->id,
                    'title' => $aiProject['title'] ?? 'Quest Project',
                    'description' => $aiProject['description'] ?? $aiQuest['description'] ?? 'Complete this project for the quest.',
                    'difficulty' => $difficulty,
                    'required_reputation' => $aiProject['required_reputation'] ?? ($gameState->reputation ?? 0),
                    'reward' => $aiProject['base_reward'] ?? 1000,
                    'progress' => 0,
                    'status' => 'queued', // Player needs to start it
                    'started_at' => null,
                    'deadline' => now()->addDays(config('game_balance.projects.quest_project_deadline_days', 10)), // Quest project deadline
                ]);
                
                $requiredProjectId = $project->id;
            }
        }

        // Create quest in database
        $quest = NPCQuest::create([
            'user_id' => $user->id,
            'npc_id' => $npcId,
            'quest_type' => $aiQuest['quest_type'] ?? 'complete_project',
            'title' => $aiQuest['title'] ?? 'New Quest',
            'description' => $aiQuest['description'] ?? '',
            'requirements' => $aiQuest['requirements'] ?? [],
            'current_progress' => 0,
            'target_progress' => $aiQuest['target_progress'] ?? 1,
            'rewards' => $aiQuest['rewards'] ?? ['money' => 100],
            'status' => 'active',
            'expires_at' => now()->addHours(config('game_balance.quests.expiry_hours', 48)), // Quests expire after configured hours
            'required_project_id' => $requiredProjectId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Quest received!' . ($requiredProjectId ? ' A project has been created for this quest.' : ''),
            'quest' => $quest->load('requiredProject:id,title,description,status'),
        ]);
    }

    /**
     * Get all active quests for the user
     */
    public function getActiveQuests(Request $request)
    {
        $user = $request->user();

        $quests = NPCQuest::with('npc:id,name,role')
            ->with('requiredProject:id,title,description,status,progress')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->get();

        return response()->json([
            'success' => true,
            'quests' => $quests,
        ]);
    }

    /**
     * Fix a quest by creating a project if missing
     */
    public function fixQuest(Request $request, $questId)
    {
        $user = $request->user();
        $quest = NPCQuest::findOrFail($questId);

        // Verify ownership
        if ($quest->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not own this quest.',
            ], 403);
        }

        // Only fix quests that need projects but don't have one
        if ($quest->required_project_id || ($quest->quest_type !== 'complete_project' && $quest->quest_type !== 'launch_product')) {
            return response()->json([
                'success' => false,
                'message' => 'This quest does not need a project or already has one.',
            ], 400);
        }

        $company = $user->companies()->first();
        if (!$company) {
            $company = Company::create([
                'user_id' => $user->id,
                'name' => $user->name . "'s Company",
                'company_level' => 1,
                'cash' => 0,
                'monthly_revenue' => 0,
                'monthly_costs' => 0,
            ]);
        }

        $gameState = $user->gameState;
        $projectContext = [
            'difficulty' => 'intermediate',
            'category' => 'any',
        ];
        
        if ($gameState && $gameState->level > 10) {
            $projectContext['difficulty'] = 'advanced';
        } elseif ($gameState && $gameState->level < 5) {
            $projectContext['difficulty'] = 'beginner';
        }

        $aiProject = $this->gemini->generateProject($projectContext);
        
        if ($aiProject) {
            // Map difficulty string to integer (1-10)
            $difficultyMap = [
                'beginner' => rand(1, 3),
                'intermediate' => rand(4, 7),
                'advanced' => rand(8, 10),
            ];
            $difficultyString = $aiProject['difficulty'] ?? 'intermediate';
            $difficulty = is_string($difficultyString) && isset($difficultyMap[$difficultyString])
                ? $difficultyMap[$difficultyString]
                : (is_numeric($difficultyString) ? (int)$difficultyString : 5);
            
            $project = Project::create([
                'user_id' => $user->id,
                'company_id' => $company->id,
                'title' => $aiProject['title'] ?? 'Quest Project',
                'description' => $aiProject['description'] ?? $quest->description ?? 'Complete this project for the quest.',
                'difficulty' => $difficulty,
                'required_reputation' => $aiProject['required_reputation'] ?? ($gameState->reputation ?? 0),
                'reward' => $aiProject['base_reward'] ?? 1000,
                'progress' => 0,
                'status' => 'queued',
                'started_at' => null,
                'deadline' => now()->addDays(config('game_balance.projects.quest_project_deadline_days', 10)),
            ]);
            
            $quest->required_project_id = $project->id;
            $quest->save();
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate project. Please try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Quest fixed! A project has been created.',
            'quest' => $quest->load('requiredProject:id,title,description,status'),
        ]);
    }

    /**
     * Reject/Delete a quest
     */
    public function rejectQuest(Request $request, $questId)
    {
        $user = $request->user();
        $quest = NPCQuest::findOrFail($questId);

        // Verify ownership
        if ($quest->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not own this quest.',
            ], 403);
        }

        // Check if already completed
        if ($quest->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reject a completed quest.',
            ], 409);
        }

        // If quest has a required project, we can optionally delete it
        // But let's keep the project so player can still complete it if they want
        // They just won't get the quest reward
        
        // Delete the quest
        $quest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Quest rejected and removed.',
        ]);
    }

    /**
     * Complete a quest
     */
    public function completeQuest(Request $request, $questId)
    {
        $user = $request->user();
        $quest = NPCQuest::findOrFail($questId);

        // Verify ownership
        if ($quest->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not own this quest.',
            ], 403);
        }

        // Check if already completed
        if ($quest->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Quest already completed.',
            ], 409);
        }

        // Complete and grant rewards
        $quest->complete($user);

        return response()->json([
            'success' => true,
            'message' => 'Quest completed! Rewards granted.',
            'quest' => $quest->fresh(),
        ]);
    }
}
