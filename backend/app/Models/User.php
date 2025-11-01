<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\AutomationSetting;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'level',
        'prestige_points',
        'last_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_active' => 'datetime',
        ];
    }

    public function gameState(): HasOne
    {
        return $this->hasOne(GameState::class);
    }

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    /**
     * Get user's primary company (accessor)
     */
    public function getCompanyAttribute()
    {
        return $this->companies()->first();
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function leaderboard(): HasOne
    {
        return $this->hasOne(Leaderboard::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'user_skills')
            ->withPivot(['level', 'experience', 'unlocked_at'])
            ->withTimestamps();
    }

    public function achievements(): BelongsToMany
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withPivot(['unlocked_at', 'notified'])
            ->withTimestamps();
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(UserPurchase::class);
    }

    public function researches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'user_researches')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }

    public function automationSetting(): HasOne
    {
        return $this->hasOne(AutomationSetting::class);
    }

    public function chats(): HasMany
    {
        return $this->hasMany(Chat::class);
    }

    /**
     * Get total skill levels
     */
    public function getTotalSkillLevels(): int
    {
        return $this->skills()->sum('user_skills.level');
    }

    /**
     * Get number of maxed skills
     */
    public function getMaxedSkillsCount(): int
    {
        return $this->skills()
            ->wherePivot('level', '>=', 10)
            ->count();
    }

    /**
     * Calculate skill bonus for a project
     */
    public function getSkillBonusForProject(string $projectTitle): float
    {
        $userSkills = $this->skills()
            ->withPivot(['level'])
            ->get();
        
        $totalBonus = 0;
        
        foreach ($userSkills as $skill) {
            $projectTypes = $skill->project_types ?? [];
            
            if (is_array($projectTypes)) {
                foreach ($projectTypes as $type) {
                    if (stripos($projectTitle, $type) !== false) {
                        // Add efficiency bonus: skill level * efficiency_bonus
                        $totalBonus += $skill->pivot->level * floatval($skill->efficiency_bonus);
                        break;
                    }
                }
            }
        }
        
        return $totalBonus;
    }

    /**
     * Get passive income from maxed skills
     */
    public function getSkillPassiveIncome(): float
    {
        $maxedSkills = $this->getMaxedSkillsCount();
        return $maxedSkills * 0.1; // $0.1/s per maxed skill
    }

    /**
     * Get click power bonus from skills
     */
    public function getSkillClickPowerBonus(): float
    {
        $totalLevels = $this->getTotalSkillLevels();
        return $totalLevels * 0.01; // +1% per skill level
    }
}

