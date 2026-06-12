<?php

use App\Models\Appointment;
use App\Models\AvailabilitySlot;
use App\Models\Client;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows agenda page to authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('agenda.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('agenda/index'));
});

it('redirects unauthenticated user from agenda', function () {
    $this->get(route('agenda.index'))->assertRedirect(route('login'));
});

it('creates appointment with valid data', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();
    $client = Client::factory()->create();

    $this->actingAs($user)
        ->post(route('agenda.store'), [
            'services' => [$service->id],
            'client_id' => $client->id,
            'date' => '2026-07-01',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'notes' => 'Test note',
        ])
        ->assertRedirect();

    expect(Appointment::count())->toBe(1);
    expect(AvailabilitySlot::count())->toBe(1);
});

it('fails to create appointment without services', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('agenda.store'), [
            'date' => '2026-07-01',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ])
        ->assertSessionHasErrors('services');
});

it('updates appointment status', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();
    $slot = AvailabilitySlot::factory()->create();
    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'service_id' => $service->id,
        'availability_slot_id' => $slot->id,
        'status' => 'pending',
    ]);
    $appointment->services()->attach($service->id, ['price' => $service->price, 'quantity' => 1]);

    $this->actingAs($user)
        ->put(route('agenda.update', $appointment), [
            'services' => [$service->id],
            'date' => $slot->date->format('Y-m-d'),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'confirmed',
        ])
        ->assertRedirect();

    expect($appointment->fresh()->status)->toBe('confirmed');
});

it('deletes appointment and its slot', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();
    $slot = AvailabilitySlot::factory()->create();
    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'service_id' => $service->id,
        'availability_slot_id' => $slot->id,
    ]);

    $this->actingAs($user)
        ->delete(route('agenda.destroy', $appointment))
        ->assertRedirect();

    expect(Appointment::count())->toBe(0);
    expect(AvailabilitySlot::count())->toBe(0);
});
