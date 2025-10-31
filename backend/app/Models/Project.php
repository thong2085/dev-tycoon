<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'company_id',
        'user_id',
        'title',
        'description',
        'difficulty',
        'reward',
        'progress',
        'started_at',
        'deadline',
        'status',
    ];

    protected $casts = [
        'reward' => 'decimal:2',
        'started_at' => 'datetime',
        'deadline' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class);
    }

    /**
     * Check if project is completed
     */
    public function isCompleted(): bool
    {
        return $this->progress >= 100;
    }

    /**
     * Check if project is overdue
     */
    public function isOverdue(): bool
    {
        return $this->deadline && now()->isAfter($this->deadline);
    }
}

