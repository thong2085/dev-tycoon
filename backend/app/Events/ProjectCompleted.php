<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $project;
    public $userId;

    public function __construct(Project $project)
    {
        $this->project = $project;
        $this->userId = $project->user_id;
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('user.' . $this->userId);
    }

    public function broadcastAs(): string
    {
        return 'project.completed';
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->project->id,
            'project_title' => $this->project->title,
            'reward' => $this->project->reward,
            'message' => "Project '{$this->project->title}' completed! Claim \${$this->project->reward}",
            'timestamp' => now()->toISOString(),
        ];
    }
}

