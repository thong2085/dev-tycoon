<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $company = Company::where('user_id', $user->id)
            ->with(['employees', 'projects', 'products'])
            ->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        // Calculate monthly costs (total employee salaries + product upkeep)
        $salaryCosts = $company->employees->sum('salary');
        $productUpkeep = $company->products->sum('upkeep');
        $company->monthly_costs = $salaryCosts + $productUpkeep;

        // Calculate monthly revenue from active products (with growth)
        $productRevenue = 0;
        foreach ($company->products as $product) {
            if (!$product->active) continue;
            $months = max(0, now()->diffInMonths($product->launched_at));
            $productRevenue += (float)$product->base_monthly_revenue * pow(1 + (float)$product->growth_rate, $months);
        }
        $company->monthly_revenue = $productRevenue;
        $company->save();

        return response()->json($company);
    }

    public function create(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();

        $company = Company::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'company_level' => 1,
            'cash' => 0,
            'monthly_revenue' => 0,
            'monthly_costs' => 0,
        ]);

        return response()->json($company, 201);
    }

    public function update(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
        ]);

        $user = $request->user();
        $company = Company::where('user_id', $user->id)->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $company->update($request->only(['name']));

        return response()->json($company);
    }
}

