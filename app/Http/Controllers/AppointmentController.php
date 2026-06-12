<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\AvailabilitySlot;
use App\Models\Client;
use App\Models\Product;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use App\Notifications\AppointmentCreatedNotification;
use App\Services\AppointmentIncomeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function __construct(private AppointmentIncomeService $incomeService) {}

    public function index(Request $request): Response
    {
        $appointments = Appointment::with(['client', 'services', 'products', 'slot'])
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Appointment $a) => [
                'id' => $a->id,
                'client' => $a->client?->only(['id', 'name', 'phone']),
                'services' => $a->services->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'price' => (float) $s->pivot->price,
                    'quantity' => $s->pivot->quantity,
                ]),
                'products' => $a->products->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'price' => (float) $p->pivot->price,
                    'quantity' => $p->pivot->quantity,
                ]),
                'date' => $a->slot?->date?->format('Y-m-d'),
                'start_time' => $a->slot?->start_time ? substr((string) $a->slot->start_time, 0, 5) : null,
                'end_time' => $a->slot?->end_time ? substr((string) $a->slot->end_time, 0, 5) : null,
                'status' => $a->status,
                'notes' => $a->notes,
                'slot_id' => $a->availability_slot_id,
            ]);

        $clients = Client::where('user_id', auth()->id())->orderBy('name')->get(['id', 'name', 'phone']);
        $services = Service::where('active', true)->orderBy('name')->get(['id', 'name', 'price', 'duration_minutes']);
        $products = Product::where('user_id', auth()->id())->where('active', true)->orderBy('name')->get(['id', 'name', 'price', 'stock']);
        $incomeCategories = TransactionCategory::where('user_id', auth()->id())
            ->where('type', 'income')
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return Inertia::render('agenda/index', [
            'appointments' => $appointments,
            'clients' => $clients,
            'services' => $services,
            'products' => $products,
            'incomeCategories' => $incomeCategories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['nullable', 'exists:clients,id'],
            'services' => ['required', 'array', 'min:1'],
            'services.*' => ['exists:services,id'],
            'products' => ['nullable', 'array'],
            'products.*' => ['exists:products,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i,H:i:s'],
            'end_time' => ['required', 'date_format:H:i,H:i:s'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $slot = AvailabilitySlot::create([
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'active' => true,
        ]);

        $appointment = Appointment::create([
            'user_id' => auth()->id(),
            'client_id' => $validated['client_id'] ?? null,
            'service_id' => $validated['services'][0] ?? null,
            'availability_slot_id' => $slot->id,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        $appointment->services()->sync(
            $this->buildServicesPivot($validated['services'])
        );

        if (! empty($validated['products'])) {
            $appointment->products()->sync(
                $this->buildProductsPivot($validated['products'])
            );
        }

        auth()->user()->notify(new AppointmentCreatedNotification($appointment->load('slot', 'client', 'services')));

        return back()->with('success', 'Cita creada exitosamente.');
    }

    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['nullable', 'exists:clients,id'],
            'services' => ['required', 'array', 'min:1'],
            'services.*' => ['exists:services,id'],
            'products' => ['nullable', 'array'],
            'products.*' => ['exists:products,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i,H:i:s'],
            'end_time' => ['required', 'date_format:H:i,H:i:s'],
            'status' => ['required', 'in:pending,confirmed,cancelled,completed'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'income_category_id' => ['nullable', 'exists:transaction_categories,id'],
        ]);

        $previousStatus = $appointment->status;

        $appointment->slot->update([
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);

        $appointment->update([
            'client_id' => $validated['client_id'] ?? null,
            'service_id' => $validated['services'][0] ?? null,
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Sync services preserving existing pivot prices
        $appointment->services()->sync(
            $this->buildServicesPivot($validated['services'], $appointment)
        );

        // Sync products preserving existing pivot prices
        $appointment->products()->sync(
            $this->buildProductsPivot($validated['products'] ?? [], $appointment)
        );

        // Auto-generate income when appointment is completed
        if ($validated['status'] === 'completed' && $previousStatus !== 'completed') {
            $appointment->load(['services', 'products', 'slot', 'client']);
            $this->incomeService->generate($appointment, $validated['income_category_id'] ?? null);
        }

        // Remove income if uncompleted
        if ($previousStatus === 'completed' && $validated['status'] !== 'completed') {
            Transaction::where('appointment_id', $appointment->id)->delete();
        }

        return back()->with('success', 'Cita actualizada.');
    }

    public function destroy(Appointment $appointment): RedirectResponse
    {
        $slot = $appointment->slot;
        Transaction::where('appointment_id', $appointment->id)->delete();
        $appointment->services()->detach();
        $appointment->products()->detach();
        $appointment->delete();
        $slot?->delete();

        return back()->with('success', 'Cita eliminada.');
    }

    /** @param array<int> $serviceIds */
    private function buildServicesPivot(array $serviceIds, ?Appointment $appointment = null): array
    {
        $pivot = [];
        foreach ($serviceIds as $id) {
            $existing = $appointment?->services->firstWhere('id', $id);
            $pivot[$id] = [
                'price' => $existing?->pivot->price ?? (Service::find($id)?->price ?? 0),
                'quantity' => $existing?->pivot->quantity ?? 1,
            ];
        }

        return $pivot;
    }

    /** @param array<int> $productIds */
    private function buildProductsPivot(array $productIds, ?Appointment $appointment = null): array
    {
        $pivot = [];
        foreach ($productIds as $id) {
            $existing = $appointment?->products->firstWhere('id', $id);
            $pivot[$id] = [
                'price' => $existing?->pivot->price ?? (Product::find($id)?->price ?? 0),
                'quantity' => $existing?->pivot->quantity ?? 1,
            ];
        }

        return $pivot;
    }
}
