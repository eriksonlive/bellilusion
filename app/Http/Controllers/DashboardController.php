<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $userId = Auth::id();
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        $today = $now->toDateString();

        // ── KPIs ─────────────────────────────────────────────────────────────
        $citasHoy = Appointment::where('user_id', $userId)
            ->whereHas('slot', fn ($q) => $q->whereDate('date', $today))
            ->count();

        $citasMes = Appointment::where('user_id', $userId)
            ->whereHas('slot', fn ($q) => $q->whereBetween('date', [$startOfMonth, $endOfMonth]))
            ->count();

        $ingresosMes = Transaction::where('user_id', $userId)
            ->where('type', 'income')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $egresosMes = Transaction::where('user_id', $userId)
            ->where('type', 'expense')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $totalClientes = Client::where('user_id', $userId)->count();

        // ── Gráfico: ingresos y egresos por semana (últimas 8 semanas) ───────
        $weeklyData = [];
        for ($i = 7; $i >= 0; $i--) {
            $weekStart = $now->copy()->subWeeks($i)->startOfWeek();
            $weekEnd = $now->copy()->subWeeks($i)->endOfWeek();

            $income = Transaction::where('user_id', $userId)
                ->where('type', 'income')
                ->whereBetween('date', [$weekStart, $weekEnd])
                ->sum('amount');

            $expense = Transaction::where('user_id', $userId)
                ->where('type', 'expense')
                ->whereBetween('date', [$weekStart, $weekEnd])
                ->sum('amount');

            $weeklyData[] = [
                'semana' => $weekStart->format('d M'),
                'ingresos' => (float) $income,
                'egresos' => (float) $expense,
            ];
        }

        // ── Gráfico: citas por estado ─────────────────────────────────────────
        $statusLabels = [
            'pending' => 'Pendientes',
            'confirmed' => 'Confirmadas',
            'completed' => 'Completadas',
            'cancelled' => 'Canceladas',
        ];

        $citasPorEstado = Appointment::where('user_id', $userId)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'name' => $statusLabels[$row->status] ?? $row->status,
                'value' => (int) $row->total,
            ])
            ->values()
            ->all();

        // ── Próximas citas ────────────────────────────────────────────────────
        $proximasCitas = Appointment::with(['client', 'service', 'slot'])
            ->where('user_id', $userId)
            ->whereHas('slot', fn ($q) => $q->where('date', '>=', $today))
            ->whereIn('status', ['pending', 'confirmed'])
            ->join('availability_slots', 'appointments.availability_slot_id', '=', 'availability_slots.id')
            ->orderBy('availability_slots.date')
            ->orderBy('availability_slots.start_time')
            ->limit(5)
            ->select('appointments.*')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'cliente' => $a->client?->name ?? 'Sin cliente',
                'servicio' => $a->service?->name ?? 'Sin servicio',
                'fecha' => $a->slot?->date,
                'hora' => $a->slot?->start_time,
                'status' => $a->status,
            ]);

        return Inertia::render('dashboard', [
            'stats' => [
                'citasHoy' => $citasHoy,
                'citasMes' => $citasMes,
                'ingresosMes' => (float) $ingresosMes,
                'egresosMes' => (float) $egresosMes,
                'totalClientes' => $totalClientes,
                'balanceMes' => (float) ($ingresosMes - $egresosMes),
            ],
            'weeklyData' => $weeklyData,
            'citasPorEstado' => $citasPorEstado,
            'proximasCitas' => $proximasCitas,
        ]);
    }
}
