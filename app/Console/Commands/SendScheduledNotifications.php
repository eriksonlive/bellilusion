<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\AppointmentReminderNotification;
use App\Notifications\LowStockNotification;
use App\Notifications\PendingDebtNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendScheduledNotifications extends Command
{
    protected $signature = 'notifications:send {--type= : reminder|stock|debt|all}';

    protected $description = 'Envía notificaciones programadas: recordatorios de citas, stock bajo y deudas pendientes';

    public function handle(): int
    {
        $type = $this->option('type') ?? 'all';

        if (in_array($type, ['reminder', 'all'])) {
            $this->sendAppointmentReminders();
        }

        if (in_array($type, ['stock', 'all'])) {
            $this->sendLowStockAlerts();
        }

        if (in_array($type, ['debt', 'all'])) {
            $this->sendPendingDebtAlerts();
        }

        return self::SUCCESS;
    }

    /** Notifica citas del día siguiente, una vez por cita. */
    private function sendAppointmentReminders(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $appointments = Appointment::with(['slot', 'client', 'services', 'user'])
            ->whereHas('slot', fn ($q) => $q->where('date', $tomorrow))
            ->whereIn('status', ['confirmed', 'pending'])
            ->get();

        foreach ($appointments as $appointment) {
            $user = $appointment->user;
            if (! $user) {
                continue;
            }

            // Evitar duplicados: verificar que no se ha enviado hoy para esta cita
            $alreadySent = $user->notifications()
                ->where('type', AppointmentReminderNotification::class)
                ->whereDate('created_at', today())
                ->where('data->action_url', '/agenda')
                ->exists();

            if (! $alreadySent) {
                $user->notify(new AppointmentReminderNotification($appointment));
                $this->line("  ✅ Recordatorio enviado: cita #{$appointment->id} → {$user->name}");
            }
        }

        $this->info("Recordatorios de citas: {$appointments->count()} procesadas.");
    }

    /** Alerta de stock bajo (≤ 5 unidades) por usuario, una vez al día. */
    private function sendLowStockAlerts(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $lowProducts = Product::where('user_id', $user->id)
                ->where('active', true)
                ->where('stock', '<=', 5)
                ->where('stock', '>=', 0)
                ->get(['id', 'name', 'stock'])
                ->map(fn ($p) => ['name' => $p->name, 'stock' => $p->stock])
                ->toArray();

            if (empty($lowProducts)) {
                continue;
            }

            $alreadySent = $user->notifications()
                ->where('type', LowStockNotification::class)
                ->whereDate('created_at', today())
                ->exists();

            if (! $alreadySent) {
                $user->notify(new LowStockNotification($lowProducts));
                $this->line("  ⚠️  Stock bajo para {$user->name}: ".count($lowProducts).' productos');
            }
        }

        $this->info('Alertas de stock bajo enviadas.');
    }

    /** Alerta de deudas pendientes, una vez al día. */
    private function sendPendingDebtAlerts(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $pending = Transaction::where('user_id', $user->id)
                ->where('payment_status', '!=', 'paid')
                ->selectRaw('COUNT(*) as total_count, SUM(amount - paid_amount) as total_debt')
                ->first();

            if (! $pending || $pending->total_count == 0) {
                continue;
            }

            $alreadySent = $user->notifications()
                ->where('type', PendingDebtNotification::class)
                ->whereDate('created_at', today())
                ->exists();

            if (! $alreadySent) {
                $user->notify(new PendingDebtNotification((int) $pending->total_count, (float) $pending->total_debt));
                $this->line("  💰 Deuda pendiente para {$user->name}: \${$pending->total_debt}");
            }
        }

        $this->info('Alertas de deudas enviadas.');
    }
}
