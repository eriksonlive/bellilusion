<?php

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows finance page to authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('finance.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('finance/index'));
});

it('redirects unauthenticated user from finance', function () {
    $this->get(route('finance.index'))->assertRedirect(route('login'));
});

it('creates income transaction', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('finance.store'), [
            'type' => 'income',
            'amount' => '150.00',
            'description' => 'Pago de servicio',
            'date' => '2026-06-01',
        ])
        ->assertRedirect();

    expect(Transaction::count())->toBe(1);
    expect(Transaction::first()->type)->toBe('income');
});

it('creates expense transaction', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('finance.store'), [
            'type' => 'expense',
            'amount' => '50.00',
            'description' => 'Compra de materiales',
            'date' => '2026-06-01',
        ])
        ->assertRedirect();

    expect(Transaction::first()->type)->toBe('expense');
});

it('fails to create transaction with invalid type', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('finance.store'), [
            'type' => 'invalid',
            'amount' => '100.00',
            'description' => 'Test',
            'date' => '2026-06-01',
        ])
        ->assertSessionHasErrors('type');
});

it('fails to create transaction with zero amount', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('finance.store'), [
            'type' => 'income',
            'amount' => '0',
            'description' => 'Test',
            'date' => '2026-06-01',
        ])
        ->assertSessionHasErrors('amount');
});

it('updates transaction', function () {
    $user = User::factory()->create();
    $transaction = Transaction::factory()->create(['user_id' => $user->id, 'amount' => 100]);

    $this->actingAs($user)
        ->put(route('finance.update', $transaction), [
            'type' => $transaction->type,
            'amount' => '200.00',
            'description' => $transaction->description,
            'date' => $transaction->date->format('Y-m-d'),
        ])
        ->assertRedirect();

    expect((float) $transaction->fresh()->amount)->toBe(200.0);
});

it('deletes transaction', function () {
    $user = User::factory()->create();
    $transaction = Transaction::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete(route('finance.destroy', $transaction))
        ->assertRedirect();

    expect(Transaction::count())->toBe(0);
});

it('shows summary with correct monthly totals', function () {
    $user = User::factory()->create();
    Transaction::factory()->create(['user_id' => $user->id, 'type' => 'income', 'amount' => 500, 'date' => now()]);
    Transaction::factory()->create(['user_id' => $user->id, 'type' => 'expense', 'amount' => 200, 'date' => now()]);

    $this->actingAs($user)
        ->get(route('finance.index'))
        ->assertInertia(fn ($page) => $page
            ->has('summary')
            ->where('summary.monthly_income', 500)
            ->where('summary.monthly_expense', 200)
            ->where('summary.monthly_balance', 300),
        );
});
