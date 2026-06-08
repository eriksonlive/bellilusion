<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\AvailabilitySlot;
use App\Models\Client;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $appointments = Appointment::with(['client', 'service', 'slot'])
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Appointment $a) => [
                'id' => $a->id,
                'client' => $a->client?->only(['id', 'name', 'phone']),
                'service' => $a->service?->only(['id', 'name', 'price', 'duration_minutes']),
                'date' => $a->slot?->date?->format('Y-m-d'),
                'start_time' => $a->slot?->start_time,
                'end_time' => $a->slot?->end_time,
                'status' => $a->status,
                'notes' => $a->notes,
                'slot_id' => $a->availability_slot_id,
            ]);

        $clients = Client::where('user_id', auth()->id())->orderBy('name')->get(['id', 'name', 'phone']);
        $services = Service::where('active', true)->orderBy('name')->get(['id', 'name', 'price', 'duration_minutes']);
        $incomeCategories = TransactionCategory::where('user_id', auth()->id())
            ->where('type', 'income')
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return Inertia::render('agenda/index', [
            'appointments' => $appointments,
            'clients' => $clients,
            'services' => $services,
            'incomeCategories' => $incomeCategories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['nullable', 'exists:clients,id'],
            'service_id' => ['required', 'exists:services,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $slot = AvailabilitySlot::create([
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'active' => true,
        ]);

        Appointment::create([
            'user_id' => auth()->id(),
            'client_id' => $validated['client_id'] ?? null,
            'service_id' => $validated['service_id'],
            'availability_slot_id' => $slot->id,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Cita creada exitosamente.');
    }

    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['nullable', 'exists:clients,id'],
            'service_id' => ['required', 'exists:services,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'status' => ['required', 'in:pending,confirmed,cancelled,completed'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'register_income' => ['nullable', 'boolean'],
            'income_amount' => ['nullable', 'numeric', 'min:0'],
            'income_description' => ['nullable', 'string', 'max:255'],
            'income_category_id' => ['nullable', 'exists:transaction_categories,id'],
        ]);

        $appointment->slot->update([
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);

        $appointment->update([
            'client_id' => $validated['client_id'] ?? null,
            'service_id' => $validated['service_id'],
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        if (($validated['register_income'] ?? false) && $validated['status'] === 'completed') {
            Transaction::create([
                'user_id' => auth()->id(),
                'type' => 'income',
                'amount' => $validated['income_amount'],
                'description' => $validated['income_description'],
                'date' => $validated['date'],
                'transaction_category_id' => $validated['income_category_id'] ?? null,
            ]);
        }

        return back()->with('success', 'Cita actualizada.');
    }

    public function destroy(Appointment $appointment): RedirectResponse
    {
        $slot = $appointment->slot;
        $appointment->delete();
        $slot?->delete();

        return back()->with('success', 'Cita eliminada.');
    }

    public function create()
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }
}
