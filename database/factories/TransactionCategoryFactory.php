<?php

namespace Database\Factories;

use App\Models\TransactionCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TransactionCategory>
 */
class TransactionCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->word(),
            'color' => fake()->randomElement(['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6']),
            'type' => fake()->randomElement(['income', 'expense']),
        ];
    }
}
