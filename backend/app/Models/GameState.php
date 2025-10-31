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
    ];

    protected $casts = [
        'money' => 'decimal:2',
        'click_power' => 'decimal:2',
        'auto_income' => 'decimal:2',
        'upgrades' => 'array',
        'last_active' => 'datetime',
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

        // Cap offline income to prevent abuse (max 8 hours)
        $maxSeconds = 8 * 3600;
        if ($secondsOffline > $maxSeconds) {
            $offlineIncome = $maxSeconds * $this->auto_income;
        }

        return round($offlineIncome, 2);
    }
}

