<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NpcConversation extends Model
{
    protected $fillable = [
        'user_id',
        'npc_id',
        'role',
        'message',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function npc(): BelongsTo
    {
        return $this->belongsTo(NPC::class, 'npc_id');
    }
}
