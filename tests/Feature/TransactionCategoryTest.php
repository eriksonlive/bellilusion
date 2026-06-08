<?php

use App\Models\TransactionCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows categories page to authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('finance.categories.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('finance/categories/index'));
});

it('creates a category', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('finance.categories.store'), [
            'name' => 'Servicios',
            'color' => '#6366f1',
            'type' => 'income',
        ])
        ->assertRedirect();

    expect(TransactionCategory::count())->toBe(1);
    expect(TransactionCategory::first()->name)->toBe('Servicios');
});

it('fails to create category with invalid color', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('finance.categories.store'), [
            'name' => 'Test',
            'color' => 'not-a-color',
            'type' => 'income',
        ])
        ->assertSessionHasErrors('color');
});

it('updates a category', function () {
    $user = User::factory()->create();
    $category = TransactionCategory::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put(route('finance.categories.update', $category), [
            'name' => 'Actualizado',
            'color' => '#ef4444',
            'type' => 'expense',
        ])
        ->assertRedirect();

    expect($category->fresh()->name)->toBe('Actualizado');
});

it('deletes a category', function () {
    $user = User::factory()->create();
    $category = TransactionCategory::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete(route('finance.categories.destroy', $category))
        ->assertRedirect();

    expect(TransactionCategory::count())->toBe(0);
});

it('only shows categories belonging to the authenticated user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    TransactionCategory::factory()->create(['user_id' => $user->id, 'name' => 'Mi categoría']);
    TransactionCategory::factory()->create(['user_id' => $otherUser->id, 'name' => 'Otra categoría']);

    $this->actingAs($user)
        ->get(route('finance.categories.index'))
        ->assertInertia(fn ($page) => $page
            ->has('categories', 1)
            ->where('categories.0.name', 'Mi categoría'),
        );
});
