<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'company_level',
        'cash',
        'monthly_revenue',
        'monthly_costs',
    ];

    protected $casts = [
        'cash' => 'decimal:2',
        'monthly_revenue' => 'decimal:2',
        'monthly_costs' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function researches(): HasMany
    {
        return $this->hasMany(Research::class);
    }
}

