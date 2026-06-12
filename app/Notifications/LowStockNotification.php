<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification
{
    use Queueable;

    /** @param array<int, array{name: string, stock: int}> $products */
    public function __construct(public readonly array $products) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $count = count($this->products);
        $names = collect($this->products)->take(3)->pluck('name')->implode(', ');
        $extra = $count > 3 ? " y {$count} más" : '';

        return [
            'type' => 'warning',
            'icon' => 'package',
            'color' => 'orange',
            'title' => "⚠️ Stock bajo en {$count} ".($count === 1 ? 'producto' : 'productos'),
            'message' => $names.$extra,
            'action_url' => '/products',
            'products' => $this->products,
        ];
    }
}
