<?php

namespace App\Http\Controllers;

use App\Models\AutomationSetting;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    public function getSettings(Request $request)
    {
        $user = $request->user();
        
        // Get or create automation settings
        $automation = $user->automationSetting;
        if (!$automation) {
            $automation = AutomationSetting::create([
                'user_id' => $user->id,
                'auto_rest_enabled' => false,
                'auto_rest_energy_threshold' => 30,
                'auto_rest_morale_threshold' => 30,
                'auto_assign_enabled' => false,
                'auto_assign_min_energy' => 50,
                'auto_assign_min_morale' => 50,
            ]);
        }

        return response()->json($automation);
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'auto_rest_enabled' => 'boolean',
            'auto_rest_energy_threshold' => 'integer|min:0|max:100',
            'auto_rest_morale_threshold' => 'integer|min:0|max:100',
            'auto_assign_enabled' => 'boolean',
            'auto_assign_min_energy' => 'integer|min:0|max:100',
            'auto_assign_min_morale' => 'integer|min:0|max:100',
        ]);

        $automation = $user->automationSetting;
        if (!$automation) {
            $automation = AutomationSetting::create([
                'user_id' => $user->id,
                ...$validated,
            ]);
        } else {
            $automation->update($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Automation settings updated',
            'data' => $automation,
        ]);
    }
}

