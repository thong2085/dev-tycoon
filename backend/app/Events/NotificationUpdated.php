<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $counts;

    public function __construct(int $userId, array $counts)
    {
        $this->userId = $userId;
        $this->counts = $counts;
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('user.' . $this->userId);
    }

    public function broadcastAs(): string
    {
        return 'notification.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'counts' => $this->counts,
            'timestamp' => now()->toISOString(),
        ];
    }
}

