<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\GameState;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            // Normalize email (trim, lowercase) for consistency
            $email = strtolower(trim($request->email));

            $user = User::create([
                'name' => $request->name,
                'email' => $email,
                'password' => Hash::make($request->password),
                'level' => 1,
                'prestige_points' => 0,
                'last_active' => now(),
            ]);

            // Create initial game state (no money field - use company cash)
            // upgrades is cast as 'array' in model, Laravel will auto-encode
            $gameStateData = [
                'user_id' => $user->id,
                'click_power' => 1,
                'auto_income' => 0,
                'xp' => 0,
                'level' => 1,
                'upgrades' => [], // Model has 'array' cast, Laravel handles JSON
                'last_active' => now(),
                'current_day' => 1, // Start at Day 1
            ];
            
            // Check if money column exists using raw query (avoid Schema::hasColumn issue)
            try {
                $hasMoneyColumn = DB::select("SHOW COLUMNS FROM `game_states` LIKE 'money'");
                if (!empty($hasMoneyColumn)) {
                    $gameStateData['money'] = 0; // Deprecated, use company cash instead
                }
            } catch (\Exception $e) {
                // Ignore check error, just don't add money field
            }
            
            $gameState = GameState::create($gameStateData);

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
            ], 201)->header('Access-Control-Allow-Origin', '*');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422)->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request' => $request->except(['password', 'password_confirmation'])
            ]);
            
            return response()->json([
                'message' => 'Registration failed',
                'error' => config('app.debug') ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'Internal server error'
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    public function login(Request $request)
    {
        // Log login attempt immediately
        Log::info('Login attempt started', [
            'email' => $request->email ?? 'missing',
            'ip' => $request->ip(),
            'has_password' => !empty($request->password)
        ]);

        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            Log::info('Login validation passed', ['email' => $request->email]);

            // Normalize email (trim, lowercase)
            $email = strtolower(trim($request->email));
            
            Log::info('Searching for user', ['normalized_email' => $email]);
            
            // Try multiple methods to find user (in case of case sensitivity issues)
            $user = User::where('email', $email)->first();
            
            // Fallback: try case-insensitive if exact match fails
            if (!$user) {
                $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
            }
            
            // Fallback: try exact match with original email (before normalization)
            if (!$user && $request->email !== $email) {
                $user = User::where('email', $request->email)->first();
            }

            Log::info('User lookup result', [
                'email' => $email,
                'user_found' => $user !== null,
                'user_id' => $user?->id
            ]);

            if (!$user) {
                Log::warning('Login attempt with non-existent email', [
                    'email' => $email,
                    'original_email' => $request->email,
                    'ip' => $request->ip()
                ]);
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            // Check password
            $passwordMatches = Hash::check($request->password, $user->password);
            Log::info('Password check result', [
                'user_id' => $user->id,
                'password_matches' => $passwordMatches
            ]);

            if (!$passwordMatches) {
                Log::warning('Login attempt with incorrect password', [
                    'email' => $email,
                    'user_id' => $user->id,
                    'ip' => $request->ip()
                ]);
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            // Update last active
            $user->update(['last_active' => now()]);
            if ($user->gameState) {
                $user->gameState->update(['last_active' => now()]);
            }

            $token = $user->createToken('game-token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
            ])->header('Access-Control-Allow-Origin', '*');
        } catch (ValidationException $e) {
            // Log validation errors for debugging
            Log::warning('Login validation exception', [
                'email' => $request->email ?? 'unknown',
                'errors' => $e->errors(),
                'ip' => $request->ip()
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage(), [
                'email' => $request->email ?? 'unknown',
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'ip' => $request->ip()
            ]);
            
            throw ValidationException::withMessages([
                'email' => ['An error occurred during login. Please try again.'],
            ]);
        }
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

