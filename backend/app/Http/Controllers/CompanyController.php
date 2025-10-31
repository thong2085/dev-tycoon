<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->with(['employees', 'projects', 'products'])->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

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
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $company->update($request->only(['name']));

        return response()->json($company);
    }
}

