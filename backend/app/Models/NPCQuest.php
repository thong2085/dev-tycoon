<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NPCQuest extends Model
{
    protected $table = 'npc_quests';
    
    protected $fillable = [
        'user_id',
        'npc_id',
        'required_project_id',
        'quest_type',
        'title',
        'description',
        'requirements',
        'current_progress',
        'target_progress',
        'rewards',
        'status',
        'expires_at',
        'completed_at',
    ];

    protected $casts = [
        'required_project_id' => 'integer',
        'current_progress' => 'integer',
        'target_progress' => 'integer',
        'requirements' => 'array',
        'rewards' => 'array',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function npc(): BelongsTo
    {
        return $this->belongsTo(NPC::class);
    }

    public function requiredProject(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'required_project_id');
    }

    /**
     * Check if quest is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && now()->gt($this->expires_at);
    }

    /**
     * Check if quest is completed
     */
    public function isCompleted(): bool
    {
        return $this->current_progress >= $this->target_progress;
    }

    /**
     * Mark quest as completed and grant rewards
     */
    public function complete(User $user): void
    {
        if ($this->status === 'completed') {
            return;
        }

        $rewards = $this->rewards ?? [];

        // Grant money
        if (isset($rewards['money'])) {
            $company = $user->companies()->first();
            if ($company) {
                $company->cash += $rewards['money'];
                $company->save();
            }
        }

        // Grant reputation
        if (isset($rewards['reputation'])) {
            $gameState = $user->gameState;
            if ($gameState) {
                $gameState->reputation += $rewards['reputation'];
                $gameState->save();
            }
        }

        // Grant XP
        if (isset($rewards['xp'])) {
            $gameState = $user->gameState;
            if ($gameState) {
                $gameState->xp += $rewards['xp'];
                $gameState->save();
            }
        }

        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();
    }
}
