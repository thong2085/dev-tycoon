<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'user_id',
        'company_id',
        'source_project_id',
        'name',
        'description',
        'base_monthly_revenue',
        'upkeep',
        'growth_rate',
        'active',
        'launched_at',
    ];

    protected $casts = [
        'base_monthly_revenue' => 'decimal:2',
        'upkeep' => 'decimal:2',
        'growth_rate' => 'decimal:4',
        'active' => 'boolean',
        'launched_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bugs(): HasMany
    {
        return $this->hasMany(ProductBug::class);
    }

    /**
     * Get active bugs affecting this product
     */
    public function getActiveBugs()
    {
        return $this->bugs()->where('status', 'active')->get();
    }

    /**
     * Get total revenue penalty from active bugs
     */
    public function getTotalPenaltyMultiplier(): float
    {
        $activeBugs = $this->getActiveBugs();
        $multiplier = 1.0;
        
        foreach ($activeBugs as $bug) {
            $multiplier *= $bug->getPenaltyMultiplier();
        }
        
        return $multiplier;
    }
}
