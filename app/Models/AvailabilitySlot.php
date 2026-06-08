<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AvailabilitySlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'start_time',
        'end_time',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'active' => 'boolean',
        ];
    }

    public function appointment(): HasOne
    {
        return $this->hasOne(Appointment::class);
    }

    public function isBooked(): bool
    {
        return $this->appointment()->exists();
    }
}
