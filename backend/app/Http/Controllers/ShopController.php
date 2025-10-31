<?php

namespace App\Http\Controllers;

use App\Models\ShopItem;
use App\Models\UserPurchase;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index(Request $request)
    {
        $items = ShopItem::where('is_available', true)
            ->orderBy('category')
            ->orderBy('order')
            ->get();

        $grouped = $items->groupBy('category');

        return response()->json([
            'success' => true,
            'items' => $items,
            'grouped' => $grouped,
        ]);
    }

    public function purchase(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:shop_items,id',
        ]);

        $user = $request->user();
        $item = ShopItem::findOrFail($request->item_id);
        $gameState = $user->gameState;

        // Check if user can afford
        if ($gameState->money < $item->price) {
            return response()->json(['error' => 'Not enough money!'], 400);
        }

        // Deduct money
        $gameState->money -= $item->price;
        $gameState->save();

        // Create purchase record
        $expiresAt = $item->duration_minutes 
            ? now()->addMinutes($item->duration_minutes)
            : null;

        $purchase = UserPurchase::create([
            'user_id' => $user->id,
            'shop_item_id' => $item->id,
            'purchased_at' => now(),
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);

        // Apply instant effects
        if ($item->effect_type === 'instant') {
            $this->applyInstantEffect($user, $item);
        }

        return response()->json([
            'success' => true,
            'message' => "Purchased {$item->name}!",
            'purchase' => $purchase,
            'game_state' => $gameState,
        ]);
    }

    public function getActivePurchases(Request $request)
    {
        $user = $request->user();
        
        $purchases = UserPurchase::where('user_id', $user->id)
            ->where('is_active', true)
            ->with('shopItem')
            ->get()
            ->filter(function ($purchase) {
                return $purchase->isActive();
            })
            ->values();

        return response()->json([
            'success' => true,
            'purchases' => $purchases,
        ]);
    }

    private function applyInstantEffect($user, $item)
    {
        $gameState = $user->gameState;
        $effect = $item->effect_data;

        switch ($effect['type'] ?? null) {
            case 'reputation':
                $gameState->reputation += $effect['amount'] ?? 0;
                $gameState->save();
                break;
            
            case 'skill_xp':
                // Add XP to random skill or all skills
                $gameState->xp += $effect['amount'] ?? 0;
                $gameState->save();
                break;
            
            case 'complete_project':
                // Complete current project
                $project = $user->projects()->where('status', 'in_progress')->first();
                if ($project) {
                    $project->progress = 100;
                    $project->status = 'completed';
                    $project->save();
                }
                break;
        }
    }
}

