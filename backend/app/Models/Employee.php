<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'role',
        'productivity',
        'skill_level',
        'salary',
        'energy',
        'status',
        'experience',
        'level',
        'morale',
        'assigned_project_id',
        'projects_completed',
        'last_worked',
    ];

    protected $casts = [
        'last_worked' => 'datetime',
        'productivity' => 'integer',
        'skill_level' => 'integer',
        'salary' => 'integer',
        'energy' => 'integer',
        'experience' => 'integer',
        'level' => 'integer',
        'morale' => 'integer',
        'assigned_project_id' => 'integer',
        'projects_completed' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'assigned_employee_id');
    }

    public function assignedProject(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'assigned_project_id');
    }

    /**
     * Get employee's effective productivity based on energy and morale
     */
    public function getEffectiveProductivity(): float
    {
        $baseProductivity = $this->productivity;
        
        // Apply research productivity bonus
        if ($this->company) {
            $user = $this->company->user;
            if ($user) {
                $researches = $user->researches()->get();
                foreach ($researches as $research) {
                    $effects = $research->effects ?? [];
                    if (isset($effects['productivity_bonus'])) {
                        $baseProductivity += $effects['productivity_bonus'];
                    }
                }
            }
        }
        
        // Energy multiplier (0-100%)
        $energyMultiplier = $this->energy / 100;
        
        // Morale bonus (0-20% bonus)
        $moraleBonus = ($this->morale - 50) / 250; // 50 = neutral, 100 = +20%, 0 = -20%
        
        // Level bonus (5% per level)
        $levelBonus = ($this->level - 1) * 0.05;
        
        $effectiveProductivity = $baseProductivity * $energyMultiplier * (1 + $moraleBonus + $levelBonus);
        
        return max(0, $effectiveProductivity);
    }

    /**
     * Calculate XP needed for next level
     */
    public function getXPForNextLevel(): int
    {
        return 100 * $this->level * 1.5;
    }

    /**
     * Add experience and check for level up
     */
    public function addExperience(int $xp): bool
    {
        $this->experience += $xp;
        $leveledUp = false;

        while ($this->experience >= $this->getXPForNextLevel()) {
            $this->experience -= $this->getXPForNextLevel();
            $this->level++;
            $this->productivity += 5; // +5 productivity per level
            $this->morale = min(100, $this->morale + 10); // Boost morale on level up
            $leveledUp = true;
        }

        $this->save();
        return $leveledUp;
    }

    /**
     * Update morale and energy based on various factors
     */
    public function updateMorale(): void
    {
        // Decrease morale over time if working
        if ($this->status === 'working' && $this->assigned_project_id) {
            $this->morale = max(0, $this->morale - 1);
        }

        // Increase morale if resting/idle
        $moraleRegen = 2; // Base +2% per minute
        
        // Apply research bonuses
        if ($this->company) {
            $user = $this->company->user;
            if ($user) {
                $researches = $user->researches()->get();
                foreach ($researches as $research) {
                    $effects = $research->effects ?? [];
                    if (isset($effects['morale_regen_bonus'])) {
                        $moraleRegen += $effects['morale_regen_bonus'];
                    }
                }
            }
        }
        
        if ($this->status === 'idle' || $this->energy < 50) {
            $this->morale = min(100, $this->morale + $moraleRegen);
        }

        // Low energy affects morale
        if ($this->energy < 30) {
            $this->morale = max(0, $this->morale - 2);
        }

        // Restore energy when idle (not working)
        $energyRegen = 3; // Base +3% per minute
        
        // Apply research bonuses
        if ($this->company) {
            $user = $this->company->user;
            if ($user) {
                $researches = $user->researches()->get();
                foreach ($researches as $research) {
                    $effects = $research->effects ?? [];
                    if (isset($effects['energy_regen_bonus'])) {
                        $energyRegen += $effects['energy_regen_bonus'];
                    }
                }
            }
        }
        
        if ($this->status === 'idle' && !$this->assigned_project_id) {
            $this->energy = min(100, $this->energy + $energyRegen);
        }

        $this->save();
    }

    /**
     * Rest employee (restore energy and morale)
     */
    public function rest(): void
    {
        $this->energy = min(100, $this->energy + 20);
        $this->morale = min(100, $this->morale + 5);
        $this->status = 'idle';
        $this->assigned_project_id = null;
        $this->save();
    }

    /**
     * Check if employee needs rest
     */
    public function needsRest(): bool
    {
        return $this->energy < 30 || $this->morale < 20;
    }

    /**
     * Get employee status emoji
     */
    public function getStatusEmoji(): string
    {
        if ($this->needsRest()) return '😫';
        if ($this->morale >= 80) return '😊';
        if ($this->morale >= 50) return '😐';
        return '😟';
    }
}

