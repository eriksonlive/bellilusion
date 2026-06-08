<?php

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows services page to authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('services.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('services/index'));
});

it('creates a service', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('services.store'), [
            'name' => 'Corte de cabello',
            'price' => '35000',
            'duration_minutes' => 60,
            'active' => true,
        ])
        ->assertRedirect();

    expect(Service::count())->toBe(1);
    expect(Service::first()->name)->toBe('Corte de cabello');
});

it('requires name and price', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('services.store'), ['duration_minutes' => 30])
        ->assertSessionHasErrors(['name', 'price']);
});

it('updates a service', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();

    $this->actingAs($user)
        ->put(route('services.update', $service), [
            'name' => 'Servicio actualizado',
            'price' => '50000',
            'active' => false,
        ])
        ->assertRedirect();

    expect($service->fresh()->name)->toBe('Servicio actualizado');
    expect($service->fresh()->active)->toBeFalse();
});

it('deletes a service', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();

    $this->actingAs($user)
        ->delete(route('services.destroy', $service))
        ->assertRedirect();

    expect(Service::count())->toBe(0);
});

it('filters active services', function () {
    $user = User::factory()->create();
    Service::factory()->create(['name' => 'Activo', 'active' => true]);
    Service::factory()->create(['name' => 'Inactivo', 'active' => false]);

    $this->actingAs($user)
        ->get(route('services.index', ['active' => 'true']))
        ->assertInertia(fn ($page) => $page->has('services.data', 1));
});
