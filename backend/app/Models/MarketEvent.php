<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketEvent extends Model
{
    protected $fillable = [
        'event_type',
        'description',
        'effect',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'effect' => 'array',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    /**
     * Check if event is currently active
     */
    public function isActive(): bool
    {
        return now()->between($this->start_time, $this->end_time);
    }

    /**
     * Get all active events
     */
    public static function getActiveEvents()
    {
        return self::where('start_time', '<=', now())
            ->where('end_time', '>=', now())
            ->get();
    }
}

