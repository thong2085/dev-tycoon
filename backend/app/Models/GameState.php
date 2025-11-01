<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameState extends Model
{
    protected $fillable = [
        'user_id',
        'company_id',
        'money',
        'click_power',
        'auto_income',
        'xp',
        'level',
        'upgrades',
        'last_active',
        'reputation',
        'completed_projects',
        'prestige_level',
        'prestige_points',
        'lifetime_earnings',
        'total_clicks',
        'current_day',
    ];

    protected $casts = [
        'money' => 'decimal:2',
        'click_power' => 'decimal:2',
        'auto_income' => 'decimal:2',
        'upgrades' => 'array',
        'last_active' => 'datetime',
        'level' => 'integer',
        'xp' => 'integer',
        'reputation' => 'integer',
        'completed_projects' => 'integer',
        'prestige_level' => 'integer',
        'prestige_points' => 'integer',
        'total_clicks' => 'integer',
        'current_day' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Calculate offline income based on time away
     */
    public function calculateOfflineIncome(): float
    {
        if (!$this->last_active) {
            return 0;
        }

        $secondsOffline = now()->diffInSeconds($this->last_active);
        $offlineIncome = $secondsOffline * $this->auto_income;

        // Cap offline income to prevent abuse (from game balance config)
        $maxHours = config('game_balance.offline.max_hours', 12);
        $maxSeconds = $maxHours * 3600;
        if ($secondsOffline > $maxSeconds) {
            $offlineIncome = $maxSeconds * $this->auto_income;
        }

        return round($offlineIncome, 2);
    }
}

