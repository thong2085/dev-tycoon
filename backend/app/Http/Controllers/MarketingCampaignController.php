<?php

namespace App\Http\Controllers;

use App\Models\MarketingCampaign;
use App\Models\Product;
use Illuminate\Http\Request;

class MarketingCampaignController extends Controller
{
    public function index(Request $request, $productId)
    {
        $user = $request->user();
        $product = Product::where('user_id', $user->id)->findOrFail($productId);

        $campaigns = MarketingCampaign::where('product_id', $product->id)
            ->orderByDesc('start_time')->get();

        return response()->json([ 'items' => $campaigns ]);
    }

    public function launch(Request $request, $productId)
    {
        $user = $request->user();
        $product = Product::where('user_id', $user->id)->findOrFail($productId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:5|max:10080',
            'revenue_multiplier' => 'required|numeric|min:1|max:5',
            'cost' => 'required|numeric|min:0',
        ]);

        $start = now();
        $end = now()->addMinutes($validated['duration_minutes']);

        $campaign = MarketingCampaign::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'name' => $validated['name'],
            'cost' => $validated['cost'],
            'revenue_multiplier' => $validated['revenue_multiplier'],
            'start_time' => $start,
            'end_time' => $end,
        ]);

        // Deduct cost from company cash immediately
        $company = $user->company;
        if ($company) {
            $company->cash = max(0, $company->cash - $campaign->cost);
            $company->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Marketing campaign launched!',
            'campaign' => $campaign,
        ]);
    }
}


