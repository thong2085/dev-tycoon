<?php

namespace App\Events;

use App\Models\Achievement;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AchievementUnlocked implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userName;
    public $achievementName;
    public $achievementIcon;

    public function __construct(User $user, Achievement $achievement)
    {
        $this->userName = $user->name;
        $this->achievementName = $achievement->name;
        $this->achievementIcon = $achievement->icon;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('global-activities');
    }

    public function broadcastAs(): string
    {
        return 'achievement.unlocked';
    }

    public function broadcastWith(): array
    {
        return [
            'user_name' => $this->userName,
            'achievement_name' => $this->achievementName,
            'achievement_icon' => $this->achievementIcon,
            'timestamp' => now()->toISOString(),
        ];
    }
}

