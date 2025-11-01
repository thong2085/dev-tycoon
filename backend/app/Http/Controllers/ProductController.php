<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Project;
use App\Models\NPCQuest;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $products = Product::where('user_id', $user->id)->orderByDesc('created_at')->get();
        
        // Calculate stats for each product
        $productsWithStats = $products->map(function ($product) {
            $monthsSinceLaunch = $product->launched_at 
                ? max(0, now()->diffInMonths($product->launched_at)) 
                : 0;
            $currentMonthlyRevenue = (float)$product->base_monthly_revenue * pow(1 + (float)$product->growth_rate, $monthsSinceLaunch);
            $netMonthlyRevenue = $currentMonthlyRevenue - (float)$product->upkeep;
            
            return [
                ...$product->toArray(),
                'stats' => [
                    'months_since_launch' => $monthsSinceLaunch,
                    'current_monthly_revenue' => round($currentMonthlyRevenue, 2),
                    'net_monthly_revenue' => round($netMonthlyRevenue, 2),
                    'total_upkeep' => (float)$product->upkeep,
                ],
            ];
        });
        
        return response()->json(['items' => $productsWithStats]);
    }

    // Launch a product from a completed project
    public function launchFromProject(Request $request, $projectId)
    {
        $user = $request->user();

        $project = Project::where('user_id', $user->id)
            ->where('status', 'completed')
            ->findOrFail($projectId);

        $company = $user->company;
        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        // Prevent duplicate launches for the same project
        $existing = Product::where('user_id', $user->id)
            ->where('source_project_id', $project->id)
            ->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'This project is already launched as a product.',
                'product' => $existing,
            ], 409);
        }

        // Product conversion formula (from game balance config)
        $revenuePercentage = config('game_balance.products.revenue_percentage', 0.12);
        $upkeepPercentage = config('game_balance.products.upkeep_percentage', 0.18);
        $growthRate = config('game_balance.products.growth_rate', 0.025);
        
        $baseMonthlyRevenue = round($project->reward * $revenuePercentage, 2);
        $upkeep = round($baseMonthlyRevenue * $upkeepPercentage, 2);

        $product = Product::create([
            'user_id' => $user->id,
            'company_id' => $company->id,
            'source_project_id' => $project->id,
            'name' => $project->title,
            'description' => $project->description,
            'base_monthly_revenue' => $baseMonthlyRevenue,
            'upkeep' => $upkeep,
            'growth_rate' => $growthRate,
            'active' => true,
            'launched_at' => now(),
        ]);

        // Update NPC quest progress (if any active quest for launch_product)
        // If quest has a specific required_project_id, only update that quest
        // Otherwise, update any quest that accepts any product launch
        $specificQuest = NPCQuest::where('user_id', $user->id)
            ->where('quest_type', 'launch_product')
            ->where('required_project_id', $project->id)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->first();

        if ($specificQuest) {
            // Only update the quest that requires this specific project
            $specificQuest->increment('current_progress');
        } else {
            // Update quests that don't have a specific project requirement (legacy/any product quests)
            NPCQuest::where('user_id', $user->id)
                ->where('quest_type', 'launch_product')
                ->whereNull('required_project_id')
                ->where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                })
                ->increment('current_progress');
        }

        return response()->json([
            'success' => true,
            'message' => 'Product launched successfully!',
            'product' => $product,
        ]);
    }

    public function pause(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::where('user_id', $user->id)->findOrFail($id);
        
        $product->active = false;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => 'Product paused successfully',
            'product' => $product,
        ]);
    }

    public function resume(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::where('user_id', $user->id)->findOrFail($id);
        
        $product->active = true;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => 'Product resumed successfully',
            'product' => $product,
        ]);
    }

    public function retire(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::where('user_id', $user->id)->findOrFail($id);
        
        $productName = $product->name;
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => "Product '{$productName}' retired successfully",
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::where('user_id', $user->id)->findOrFail($id);
        
        // Calculate current monthly revenue with growth
        $monthsSinceLaunch = $product->launched_at 
            ? max(0, now()->diffInMonths($product->launched_at)) 
            : 0;
        $currentMonthlyRevenue = (float)$product->base_monthly_revenue * pow(1 + (float)$product->growth_rate, $monthsSinceLaunch);
        $netMonthlyRevenue = $currentMonthlyRevenue - (float)$product->upkeep;

        return response()->json([
            'success' => true,
            'product' => $product,
            'stats' => [
                'months_since_launch' => $monthsSinceLaunch,
                'current_monthly_revenue' => round($currentMonthlyRevenue, 2),
                'net_monthly_revenue' => round($netMonthlyRevenue, 2),
                'total_upkeep' => (float)$product->upkeep,
            ],
        ]);
    }
}


