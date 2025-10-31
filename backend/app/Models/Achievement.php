<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Achievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'description',
        'icon',
        'category',
        'requirement_value',
        'requirement_type',
        'reward_money',
        'reward_xp',
        'reward_prestige_points',
        'order',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_achievements')
            ->withPivot(['unlocked_at', 'notified'])
            ->withTimestamps();
    }

    /**
     * Check if user has unlocked this achievement
     */
    public function isUnlockedBy(User $user): bool
    {
        return $this->users()->where('user_id', $user->id)->exists();
    }

    /**
     * Get progress towards this achievement for a user
     */
    public function getProgressFor(User $user): float
    {
        $current = $this->getCurrentValueFor($user);
        $required = $this->requirement_value;
        
        return min(100, ($current / $required) * 100);
    }

    /**
     * Get current value for the requirement type
     */
    private function getCurrentValueFor(User $user): int
    {
        $gameState = $user->gameState;
        
        return match($this->requirement_type) {
            'money' => $gameState->money,
            'level' => $gameState->level,
            'projects' => $gameState->completed_projects ?? 0,
            'reputation' => $gameState->reputation ?? 0,
            'clicks' => $gameState->total_clicks ?? 0,
            'employees' => $user->companies()->first()?->employees()->count() ?? 0,
            'skills' => $user->skills()->count(),
            'prestige' => $gameState->prestige_level ?? 0,
            default => 0,
        };
    }
}

