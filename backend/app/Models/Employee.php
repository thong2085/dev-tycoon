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
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'assigned_employee_id');
    }

    /**
     * Get employee's effective productivity based on energy
     */
    public function getEffectiveProductivity(): int
    {
        return (int) ($this->productivity * ($this->energy / 100));
    }
}

