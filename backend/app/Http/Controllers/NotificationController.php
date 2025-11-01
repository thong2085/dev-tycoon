<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Achievement;
use App\Models\Employee;
use App\Models\Product;
use App\Models\ProductBug;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notification counts for the user
     */
    public function getCounts(Request $request)
    {
        $user = $request->user();
        $company = $user->company;
        
        $counts = [
            'projects' => 0,
            'achievements' => 0,
            'employees' => 0,
            'products' => 0,
        ];
        
        // 1. PROJECTS: Count completed projects (ready to claim)
        $counts['projects'] = Project::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();
        
        // 2. ACHIEVEMENTS: Count unlocked but not viewed achievements
        // Assuming we add a 'viewed' field later, for now count recently unlocked
        $counts['achievements'] = $user->achievements()
            ->wherePivot('unlocked_at', '>=', now()->subHours(24))
            ->count();
        
        // 3. EMPLOYEES: Count employees needing rest (low energy OR low morale)
        if ($company) {
            $counts['employees'] = Employee::where('company_id', $company->id)
                ->where(function ($query) {
                    $query->where('energy', '<', 30)
                          ->orWhere('morale', '<', 30);
                })
                ->count();
        }
        
        // 4. PRODUCTS: Count active bugs on products
        $counts['products'] = ProductBug::whereHas('product', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('status', 'active')
            ->count();
        
        return response()->json([
            'success' => true,
            'counts' => $counts,
            'total' => array_sum($counts),
        ]);
    }
    
    /**
     * Get detailed notifications
     */
    public function getNotifications(Request $request)
    {
        $user = $request->user();
        $company = $user->company;
        
        $notifications = [];
        
        // Completed projects
        $completedProjects = Project::where('user_id', $user->id)
            ->where('status', 'completed')
            ->get(['id', 'title', 'reward']);
        
        foreach ($completedProjects as $project) {
            $notifications[] = [
                'type' => 'project',
                'title' => 'Project Completed!',
                'message' => "{$project->title} - Claim \${$project->reward}",
                'link' => '/dashboard/projects',
                'data' => $project,
            ];
        }
        
        // Recent achievements
        $recentAchievements = $user->achievements()
            ->wherePivot('unlocked_at', '>=', now()->subHours(24))
            ->get();
        
        foreach ($recentAchievements as $achievement) {
            $notifications[] = [
                'type' => 'achievement',
                'title' => 'Achievement Unlocked!',
                'message' => "{$achievement->icon} {$achievement->name}",
                'link' => '/dashboard/achievements',
                'data' => $achievement,
            ];
        }
        
        // Employees needing rest
        if ($company) {
            $tiredEmployees = Employee::where('company_id', $company->id)
                ->where(function ($query) {
                    $query->where('energy', '<', 30)
                          ->orWhere('morale', '<', 30);
                })
                ->get(['id', 'name', 'energy', 'morale']);
            
            foreach ($tiredEmployees as $employee) {
                $reason = $employee->energy < 30 ? 'Low Energy' : 'Low Morale';
                $notifications[] = [
                    'type' => 'employee',
                    'title' => 'Employee Needs Rest!',
                    'message' => "{$employee->name} - {$reason} ({$employee->energy}% energy, {$employee->morale}% morale)",
                    'link' => '/dashboard/employees',
                    'data' => $employee,
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'count' => count($notifications),
        ]);
    }
}

