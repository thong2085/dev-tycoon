<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\GameState;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'level' => 1,
            'prestige_points' => 0,
            'last_active' => now(),
        ]);

        // Create initial game state (no money field - use company cash)
        $gameState = GameState::create([
            'user_id' => $user->id,
            'money' => 0, // Deprecated, use company cash instead
            'click_power' => 1,
            'auto_income' => 0,
            'xp' => 0,
            'level' => 1,
            'upgrades' => [],
            'last_active' => now(),
        ]);

        // Create initial company with starting cash
        $company = Company::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Startup",
            'company_level' => 1,
            'cash' => 100, // Starting cash
            'monthly_revenue' => 0,
            'monthly_costs' => 0,
        ]);

        // Link company to game state
        $gameState->update(['company_id' => $company->id]);

        $token = $user->createToken('game-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'game_state' => $gameState,
            'company' => $company,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last active
        $user->update(['last_active' => now()]);
        $user->gameState->update(['last_active' => now()]);

        $token = $user->createToken('game-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}

