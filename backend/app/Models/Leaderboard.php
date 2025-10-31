<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Leaderboard extends Model
{
    protected $fillable = [
        'user_id',
        'rank',
        'score',
    ];

    protected $casts = [
        'score' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Update leaderboard rankings
     */
    public static function updateRankings(): void
    {
        $rankings = self::orderBy('score', 'desc')->get();
        
        foreach ($rankings as $index => $entry) {
            $entry->update(['rank' => $index + 1]);
        }
    }
}

