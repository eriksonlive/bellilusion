<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'service_id',
        'availability_slot_id',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /** @deprecated Use services() relation instead */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(AvailabilitySlot::class, 'availability_slot_id');
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'appointment_services')
            ->withPivot(['price', 'quantity'])
            ->withTimestamps();
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'appointment_products')
            ->withPivot(['price', 'quantity'])
            ->withTimestamps();
    }
}
