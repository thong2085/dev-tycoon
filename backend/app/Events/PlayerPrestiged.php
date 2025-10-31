<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerPrestiged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userName;
    public $prestigeLevel;
    public $pointsGained;

    public function __construct(User $user, int $prestigeLevel, int $pointsGained)
    {
        $this->userName = $user->name;
        $this->prestigeLevel = $prestigeLevel;
        $this->pointsGained = $pointsGained;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('global-activities');
    }

    public function broadcastAs(): string
    {
        return 'player.prestiged';
    }

    public function broadcastWith(): array
    {
        return [
            'user_name' => $this->userName,
            'prestige_level' => $this->prestigeLevel,
            'points_gained' => $this->pointsGained,
            'timestamp' => now()->toISOString(),
        ];
    }
}

