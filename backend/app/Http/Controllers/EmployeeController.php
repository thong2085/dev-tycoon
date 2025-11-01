<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\NPCQuest;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $employees = $company->employees()->with('assignedProject')->get()->map(function ($employee) {
            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'role' => $employee->role,
                'productivity' => $employee->productivity,
                'skill_level' => $employee->skill_level,
                'salary' => $employee->salary,
                'energy' => $employee->energy,
                'status' => $employee->status,
                'morale' => $employee->morale,
                'level' => $employee->level,
                'experience' => $employee->experience,
                'xp_for_next_level' => $employee->getXPForNextLevel(),
                'projects_completed' => $employee->projects_completed,
                'effective_productivity' => $employee->getEffectiveProductivity(),
                'status_emoji' => $employee->getStatusEmoji(),
                'needs_rest' => $employee->needsRest(),
                'assigned_project' => $employee->assignedProject ? [
                    'id' => $employee->assignedProject->id,
                    'title' => $employee->assignedProject->title,
                    'progress' => $employee->assignedProject->progress,
                ] : null,
                'created_at' => $employee->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $employees
        ]);
    }

    public function hire(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|in:junior,mid,senior,lead,architect',
        ]);

        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        // Calculate cost based on role (from game balance config)
        $costs = config('game_balance.employees.hire_costs', [
            'junior' => 1500,
            'mid' => 3500,
            'senior' => 7500,
            'lead' => 15000,
            'architect' => 30000,
        ]);

        $cost = $costs[$request->role] ?? $costs['junior'];

        // Check COMPANY cash, not gameState money
        if ($company->cash < $cost) {
            return response()->json(['error' => 'Not enough money'], 400);
        }

        // Skills based on role (from game balance config)
        $skills = config('game_balance.employees.productivity', [
            'junior' => 50,
            'mid' => 75,
            'senior' => 100,
            'lead' => 125,
            'architect' => 150,
        ]);
        
        $salaryMultiplier = config('game_balance.employees.salary_multiplier', 0.12);

        $employee = Employee::create([
            'company_id' => $company->id,
            'name' => $request->name,
            'role' => $request->role,
            'productivity' => $skills[$request->role] ?? $skills['junior'],
            'skill_level' => array_search($request->role, array_keys($skills)) + 1,
            'salary' => round($cost * $salaryMultiplier, 2), // Monthly salary
            'energy' => 100,
            'status' => 'idle',
        ]);

        // Deduct cost from COMPANY cash
        $company->cash -= $cost;
        $company->save();

        // Increase company costs
        $company->monthly_costs += $employee->salary;
        $company->save();

        // Update NPC quest progress (if any active quest for hire_employee)
        NPCQuest::where('user_id', $user->id)
            ->where('quest_type', 'hire_employee')
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->increment('current_progress');

        return response()->json([
            'success' => true,
            'data' => $employee,
            'company' => $company,
            'message' => "Hired {$employee->name} as {$employee->role}!"
        ], 201);
    }

    public function fire(Request $request, $id)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $employee = $company->employees()->findOrFail($id);

        // Reduce company costs
        $company->monthly_costs -= $employee->salary;
        $company->save();

        // Unassign tasks
        ProjectTask::where('assigned_employee_id', $employee->id)
            ->update(['assigned_employee_id' => null]);

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => "{$employee->name} has been fired."
        ]);
    }

    public function assignTask(Request $request, $id)
    {
        $request->validate([
            'task_id' => 'required|integer|exists:project_tasks,id',
        ]);

        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $employee = $company->employees()->findOrFail($id);
        $task = ProjectTask::findOrFail($request->task_id);

        if ($employee->status !== 'idle') {
            return response()->json(['error' => 'Employee is busy'], 400);
        }

        $task->assigned_employee_id = $employee->id;
        $task->save();

        $employee->status = 'working';
        $employee->save();

        return response()->json([
            'success' => true,
            'employee' => $employee,
            'task' => $task,
        ]);
    }

    /**
     * Assign employee to a project
     */
    public function assignToProject(Request $request, $id)
    {
        $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
        ]);

        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $employee = $company->employees()->findOrFail($id);

        // Check if employee needs rest
        if ($employee->needsRest()) {
            return response()->json([
                'error' => "{$employee->name} is too tired and needs rest!",
                'needs_rest' => true
            ], 400);
        }

        // Assign to project
        $employee->assigned_project_id = $request->project_id;
        $employee->status = 'working';
        $employee->last_worked = now();
        $employee->save();

        return response()->json([
            'success' => true,
            'message' => "{$employee->name} assigned to project!",
            'data' => $employee->load('assignedProject'),
        ]);
    }

    /**
     * Unassign employee from project
     */
    public function unassignFromProject(Request $request, $id)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $employee = $company->employees()->findOrFail($id);
        $employee->assigned_project_id = null;
        $employee->status = 'idle';
        $employee->save();

        return response()->json([
            'success' => true,
            'message' => "{$employee->name} unassigned from project.",
            'data' => $employee,
        ]);
    }

    /**
     * Rest employee (restore energy and morale)
     */
    public function rest(Request $request, $id)
    {
        $user = $request->user();
        $company = $user->companies()->first();

        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $employee = $company->employees()->findOrFail($id);
        $employee->rest();

        return response()->json([
            'success' => true,
            'message' => "{$employee->name} is now resting and recovering.",
            'data' => $employee,
        ]);
    }
}

