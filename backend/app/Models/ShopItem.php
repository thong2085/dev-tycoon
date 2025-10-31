<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShopItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'description',
        'icon',
        'category',
        'price',
        'duration_minutes',
        'effect_type',
        'effect_data',
        'is_available',
        'order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'effect_data' => 'array',
        'is_available' => 'boolean',
    ];

    public function purchases(): HasMany
    {
        return $this->hasMany(UserPurchase::class);
    }
}

