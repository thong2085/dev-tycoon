<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Research extends Model
{
    protected $fillable = [
        'company_id',
        'tech_name',
        'level',
        'bonuses',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'bonuses' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Check if research is completed
     */
    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }
}

