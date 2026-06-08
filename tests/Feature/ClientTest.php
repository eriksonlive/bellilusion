<?php

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows clients page to authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('clients.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('clients/index'));
});

it('redirects unauthenticated user', function () {
    $this->get(route('clients.index'))->assertRedirect(route('login'));
});

it('creates a client', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('clients.store'), [
            'name' => 'Ana García',
            'phone' => '+57 300 123 4567',
            'email' => 'ana@example.com',
        ])
        ->assertRedirect();

    expect(Client::count())->toBe(1);
    expect(Client::first()->name)->toBe('Ana García');
    expect(Client::first()->user_id)->toBe($user->id);
});

it('requires name to create a client', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('clients.store'), ['phone' => '123'])
        ->assertSessionHasErrors('name');
});

it('updates a client', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put(route('clients.update', $client), ['name' => 'Nombre Actualizado'])
        ->assertRedirect();

    expect($client->fresh()->name)->toBe('Nombre Actualizado');
});

it('deletes a client', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete(route('clients.destroy', $client))
        ->assertRedirect();

    expect(Client::count())->toBe(0);
});

it('only shows clients belonging to the user', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    Client::factory()->create(['user_id' => $user->id, 'name' => 'Mi cliente']);
    Client::factory()->create(['user_id' => $other->id, 'name' => 'Otro cliente']);

    $this->actingAs($user)
        ->get(route('clients.index'))
        ->assertInertia(fn ($page) => $page
            ->has('clients.data', 1)
            ->where('clients.data.0.name', 'Mi cliente'),
        );
});

it('filters clients by search', function () {
    $user = User::factory()->create();
    Client::factory()->create(['user_id' => $user->id, 'name' => 'Ana García']);
    Client::factory()->create(['user_id' => $user->id, 'name' => 'Pedro López']);

    $this->actingAs($user)
        ->get(route('clients.index', ['search' => 'Ana']))
        ->assertInertia(fn ($page) => $page->has('clients.data', 1));
});
