<?php

namespace Database\Factories;

use App\Models\AvailabilitySlot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AvailabilitySlot>
 */
class AvailabilitySlotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'date' => fake()->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'active' => true,
        ];
    }
}
