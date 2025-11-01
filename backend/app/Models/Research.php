<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Research extends Model
{
    protected $table = 'researches';
    
    protected $fillable = [
        'key', 'name', 'description', 'category', 'cost', 'required_level', 'effects', 'icon',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'effects' => 'array',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_researches')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }
}
