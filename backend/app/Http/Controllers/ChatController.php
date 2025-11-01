<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Services\GeminiService;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Get conversation history for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $messages = Chat::where('user_id', $user->id)
            ->orderBy('created_at', 'asc')
            ->get(['id', 'role', 'message', 'created_at']);

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message to AI Mentor
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $user = $request->user();
        $message = $request->message;

        // Get conversation history BEFORE saving new message (last 20 messages for context)
        $conversationHistory = Chat::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get(['role', 'message'])
            ->reverse()
            ->values()
            ->toArray();

        // Save user message to database
        $userMessage = Chat::create([
            'user_id' => $user->id,
            'role' => 'user',
            'message' => $message,
        ]);

        // Get game context for personalized advice
        $gameState = $user->gameState;
        $company = $user->companies()->first();
        
        $gameContext = [];
        if ($gameState) {
            $gameContext['level'] = $gameState->level;
            $gameContext['reputation'] = $gameState->reputation ?? 0;
            $gameContext['completed_projects'] = $gameState->completed_projects ?? 0;
        }
        if ($company) {
            $gameContext['company_level'] = $company->company_level;
            $gameContext['employees_count'] = $company->employees()->count();
            $gameContext['products_count'] = $company->products()->count();
        }

        // Get AI response
        $aiResponse = $this->gemini->chat($conversationHistory, $gameContext);

        if (!$aiResponse) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get AI response. Please try again.',
            ], 500);
        }

        // Save AI response to database
        $aiMessage = Chat::create([
            'user_id' => $user->id,
            'role' => 'assistant',
            'message' => $aiResponse,
        ]);

        return response()->json([
            'success' => true,
            'user_message' => $userMessage,
            'ai_message' => $aiMessage,
        ]);
    }

    /**
     * Clear conversation history
     */
    public function clear(Request $request)
    {
        $user = $request->user();
        
        Chat::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation history cleared',
        ]);
    }
}
