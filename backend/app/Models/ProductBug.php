<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBug extends Model
{
    protected $fillable = [
        'product_id',
        'title',
        'description',
        'severity',
        'revenue_penalty',
        'fix_cost',
        'fix_time_minutes',
        'status',
        'discovered_at',
        'fix_started_at',
        'fixed_at',
    ];

    protected $casts = [
        'revenue_penalty' => 'decimal:2',
        'discovered_at' => 'datetime',
        'fix_started_at' => 'datetime',
        'fixed_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Check if bug is currently affecting revenue
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Get penalty multiplier (e.g., 0.90 for 10% penalty)
     */
    public function getPenaltyMultiplier(): float
    {
        return 1 - ($this->revenue_penalty / 100);
    }
}

