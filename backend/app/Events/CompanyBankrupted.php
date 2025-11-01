<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanyBankrupted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $companyName;
    public $employeeCount;
    public $cash;

    /**
     * Create a new event instance.
     */
    public function __construct(int $userId, string $companyName, int $employeeCount, float $cash)
    {
        $this->userId = $userId;
        $this->companyName = $companyName;
        $this->employeeCount = $employeeCount;
        $this->cash = $cash;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'company.bankrupted';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'message' => "💥 Company '{$this->companyName}' declared BANKRUPTCY! All {$this->employeeCount} employee(s) fired due to insufficient funds (\${$this->cash}).",
            'company_name' => $this->companyName,
            'employee_count' => $this->employeeCount,
            'cash' => $this->cash,
        ];
    }
}
