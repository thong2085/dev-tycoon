<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutomationSetting extends Model
{
    protected $fillable = [
        'user_id',
        'auto_rest_enabled',
        'auto_rest_energy_threshold',
        'auto_rest_morale_threshold',
        'auto_assign_enabled',
        'auto_assign_min_energy',
        'auto_assign_min_morale',
    ];

    protected $casts = [
        'auto_rest_enabled' => 'boolean',
        'auto_assign_enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

