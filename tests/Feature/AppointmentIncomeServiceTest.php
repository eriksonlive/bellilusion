<?php

use App\Models\Appointment;
use App\Models\AvailabilitySlot;
use App\Models\Client;
use App\Models\Product;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Services\AppointmentIncomeService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('generates a transaction with items when appointment is completed', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $service = Service::factory()->create(['price' => 50000, 'name' => 'Corte de cabello']);
    $product = Product::factory()->create(['user_id' => $user->id, 'price' => 15000, 'name' => 'Shampoo']);
    $slot = AvailabilitySlot::factory()->create(['date' => '2026-07-01']);

    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'client_id' => $client->id,
        'availability_slot_id' => $slot->id,
        'service_id' => $service->id,
        'status' => 'completed',
    ]);

    $appointment->services()->attach($service->id, ['price' => 50000, 'quantity' => 1]);
    $appointment->products()->attach($product->id, ['price' => 15000, 'quantity' => 2]);

    $incomeService = app(AppointmentIncomeService::class);
    $transaction = $incomeService->generate($appointment);

    expect(Transaction::count())->toBe(1);
    expect($transaction->amount)->toBe('80000.00'); // 50000 servicio + 15000×2 producto
    expect($transaction->type)->toBe('income');
    expect($transaction->appointment_id)->toBe($appointment->id);
    expect($transaction->user_id)->toBe($user->id);

    expect(TransactionItem::count())->toBe(2);

    $serviceItem = TransactionItem::where('type', 'service')->first();
    expect($serviceItem->name)->toBe('Corte de cabello');
    expect($serviceItem->unit_price)->toBe('50000.00');
    expect($serviceItem->quantity)->toBe(1);
    expect($serviceItem->subtotal)->toBe('50000.00');

    $productItem = TransactionItem::where('type', 'product')->first();
    expect($productItem->name)->toBe('Shampoo');
    expect($productItem->unit_price)->toBe('15000.00');
    expect($productItem->quantity)->toBe(2);
    expect($productItem->subtotal)->toBe('30000.00');
});

it('regenerates transaction if appointment is re-completed', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 30000]);
    $slot = AvailabilitySlot::factory()->create(['date' => '2026-07-01']);

    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'availability_slot_id' => $slot->id,
        'service_id' => $service->id,
        'status' => 'completed',
    ]);

    $appointment->services()->attach($service->id, ['price' => 30000, 'quantity' => 1]);

    $incomeService = app(AppointmentIncomeService::class);
    $incomeService->generate($appointment);
    $incomeService->generate($appointment); // re-generate

    expect(Transaction::count())->toBe(1);
    expect(TransactionItem::count())->toBe(1);
});

it('auto-generates income when appointment status changes to completed via controller', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 40000]);
    $client = Client::factory()->create(['user_id' => $user->id]);
    $slot = AvailabilitySlot::factory()->create(['date' => '2026-07-15', 'start_time' => '10:00', 'end_time' => '11:00', 'active' => true]);

    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'client_id' => $client->id,
        'availability_slot_id' => $slot->id,
        'service_id' => $service->id,
        'status' => 'confirmed',
    ]);

    $appointment->services()->attach($service->id, ['price' => 40000, 'quantity' => 1]);

    $this->actingAs($user)
        ->put(route('agenda.update', $appointment), [
            'services' => [$service->id],
            'client_id' => $client->id,
            'date' => '2026-07-15',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'completed',
        ])
        ->assertRedirect();

    expect(Transaction::where('appointment_id', $appointment->id)->count())->toBe(1);
    expect(Transaction::where('appointment_id', $appointment->id)->first()->amount)->toBe('40000.00');
    expect(TransactionItem::count())->toBe(1);
});
