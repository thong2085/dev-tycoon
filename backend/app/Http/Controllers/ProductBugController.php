<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductBug;
use Illuminate\Http\Request;

class ProductBugController extends Controller
{
    /**
     * Get bugs for a product
     */
    public function index(Request $request, $productId)
    {
        $user = $request->user();
        $product = Product::where('user_id', $user->id)->findOrFail($productId);
        
        $bugs = $product->bugs()->orderBy('severity', 'desc')
            ->orderBy('discovered_at', 'desc')
            ->get();

        return response()->json($bugs);
    }

    /**
     * Start fixing a bug
     */
    public function startFix(Request $request, $bugId)
    {
        $user = $request->user();
        $bug = ProductBug::with('product')->findOrFail($bugId);
        
        // Verify product belongs to user
        if ($bug->product->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if bug is already fixed
        if ($bug->status === 'fixed') {
            return response()->json(['error' => 'Bug already fixed'], 400);
        }

        // Check if already fixing
        if ($bug->status === 'fixing') {
            return response()->json([
                'success' => true,
                'message' => 'Bug fix already in progress',
                'bug' => $bug,
            ]);
        }

        // Check COMPANY cash, not gameState money
        $company = $user->company;
        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }
        
        if ($company->cash < $bug->fix_cost) {
            return response()->json([
                'error' => "Not enough money. Need $" . number_format($bug->fix_cost, 2) . ", have $" . number_format($company->cash, 2),
            ], 403);
        }

        // Deduct fix cost from COMPANY cash
        $company->cash -= $bug->fix_cost;
        $company->save();

        // Start fixing
        $bug->status = 'fixing';
        $bug->fix_started_at = now();
        $bug->save();

        // Broadcast notification update (bug status changed to 'fixing', so active count decreases)
        $this->broadcastNotificationUpdate($user);

        return response()->json([
            'success' => true,
            'message' => "Started fixing bug. Will complete in {$bug->fix_time_minutes} minutes.",
            'bug' => $bug,
            'company' => $company,
        ]);
    }

    /**
     * Complete bug fix (called after fix_time_minutes)
     */
    public function completeFix(Request $request, $bugId)
    {
        $user = $request->user();
        $bug = ProductBug::with('product')->findOrFail($bugId);
        
        // Verify product belongs to user
        if ($bug->product->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if bug is in fixing status
        if ($bug->status !== 'fixing') {
            return response()->json(['error' => 'Bug is not being fixed'], 400);
        }

        // Mark as fixed
        $bug->status = 'fixed';
        $bug->fixed_at = now();
        $bug->save();

        // Broadcast notification update
        $this->broadcastNotificationUpdate($user);

        return response()->json([
            'success' => true,
            'message' => "Bug '{$bug->title}' has been fixed!",
            'bug' => $bug,
        ]);
    }

    protected function broadcastNotificationUpdate($user): void
    {
        if (!$user) return;
        
        $company = $user->company;
        
        $counts = [
            'projects' => \App\Models\Project::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count(),
            'achievements' => $user->achievements()
                ->wherePivot('unlocked_at', '>=', now()->subHours(24))
                ->count(),
            'employees' => 0,
            'products' => \App\Models\ProductBug::whereHas('product', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
                ->where('status', 'active')
                ->count(),
        ];
        
        if ($company) {
            $counts['employees'] = \App\Models\Employee::where('company_id', $company->id)
                ->where(function ($query) {
                    $query->where('energy', '<', 30)
                          ->orWhere('morale', '<', 30);
                })
                ->count();
        }
        
        broadcast(new \App\Events\NotificationUpdated($user->id, $counts));
    }
}

