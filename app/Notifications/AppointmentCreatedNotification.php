<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentCreatedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $client = $this->appointment->client?->name ?? 'Sin cliente';
        $time = substr((string) ($this->appointment->slot?->start_time ?? ''), 0, 5);
        $date = $this->appointment->slot?->date?->format('d/m/Y') ?? '';
        $service = $this->appointment->services->first()?->name ?? 'Cita';

        return [
            'type' => 'success',
            'icon' => 'calendar-check',
            'color' => 'green',
            'title' => '✅ Nueva cita agendada',
            'message' => "{$client} · {$service} · {$date} {$time}",
            'action_url' => '/agenda',
        ];
    }
}
