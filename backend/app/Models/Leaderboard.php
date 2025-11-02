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
        'money',
        'level',
        'reputation',
        'projects_completed',
    ];

    protected $casts = [
        'rank' => 'integer',
        'score' => 'decimal:2',
        'money' => 'decimal:2',
        'level' => 'integer',
        'reputation' => 'integer',
        'projects_completed' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Update leaderboard rankings based on score (money by default)
     */
    public static function updateRankings(): void
    {
        $rankings = self::orderBy('score', 'desc')->get();
        
        foreach ($rankings as $index => $entry) {
            $entry->update(['rank' => $index + 1]);
        }
    }

    /**
     * Update or create leaderboard entry for a user
     */
    public static function updateEntry($userId, $gameState, $company = null): void
    {
        // Use company cash as primary score if available, otherwise use gameState money
        $score = $company ? $company->cash : $gameState->money;
        
        self::updateOrCreate(
            ['user_id' => $userId],
            [
                'score' => $score, // Primary score = company cash
                'money' => $score, // Display as money
                'level' => $gameState->level,
                'reputation' => $gameState->reputation ?? 0,
                'projects_completed' => $gameState->completed_projects ?? 0,
            ]
        );

        // Update rankings
        self::updateRankings();
    }
}

