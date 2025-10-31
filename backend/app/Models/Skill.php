<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    protected $fillable = [
        'name',
        'category',
        'description',
        'icon',
        'base_unlock_cost',
        'upgrade_multiplier',
        'max_level',
        'project_types',
        'efficiency_bonus',
    ];

    protected $casts = [
        'project_types' => 'array',
        'base_unlock_cost' => 'decimal:2',
        'upgrade_multiplier' => 'decimal:2',
        'efficiency_bonus' => 'decimal:2',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_skills')
            ->withPivot(['level', 'experience', 'unlocked_at'])
            ->withTimestamps();
    }

    /**
     * Calculate cost to unlock this skill
     */
    public function getUnlockCost(): float
    {
        return (float) $this->base_unlock_cost;
    }

    /**
     * Calculate cost to upgrade from current level to next
     */
    public function getUpgradeCost(int $currentLevel): float
    {
        return (float) ($this->base_unlock_cost * pow($this->upgrade_multiplier, $currentLevel));
    }
}

