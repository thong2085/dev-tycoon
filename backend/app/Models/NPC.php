<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NPC extends Model
{
    protected $table = 'npcs';
    
    protected $fillable = [
        'name',
        'role',
        'description',
        'personality',
        'background',
        'required_company_level',
        'can_give_quests',
        'quest_types',
    ];

    protected $casts = [
        'can_give_quests' => 'boolean',
        'quest_types' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get icon based on role
     */
    public function getIconAttribute(): string
    {
        return match($this->role) {
            'client' => '👤',
            'investor' => '💰',
            'mentor' => '🎓',
            'competitor' => '⚔️',
            default => '👤',
        };
    }

    /**
     * Get quests offered by this NPC
     */
    public function quests(): HasMany
    {
        return $this->hasMany(NPCQuest::class);
    }
}
