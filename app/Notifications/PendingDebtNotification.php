<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PendingDebtNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly int $count,
        public readonly float $totalAmount
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $formatted = number_format($this->totalAmount, 0, ',', '.');

        return [
            'type' => 'alert',
            'icon' => 'wallet',
            'color' => 'red',
            'title' => "💰 {$this->count} ".($this->count === 1 ? 'deuda pendiente' : 'deudas pendientes'),
            'message' => "Total por cobrar: \${$formatted}",
            'action_url' => '/finance?payment_status=pending',
        ];
    }
}
