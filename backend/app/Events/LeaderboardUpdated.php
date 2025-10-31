<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LeaderboardUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $category;

    public function __construct(string $category = 'money')
    {
        $this->category = $category;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('leaderboard');
    }

    public function broadcastAs(): string
    {
        return 'leaderboard.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'category' => $this->category,
            'timestamp' => now()->toISOString(),
        ];
    }
}

