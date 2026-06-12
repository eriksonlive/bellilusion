<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'appointment_id',
        'transaction_category_id',
        'type',
        'amount',
        'description',
        'date',
        'notes',
        'payment_status',
        'paid_amount',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TransactionCategory::class, 'transaction_category_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(TransactionPayment::class);
    }

    /** Recalcula paid_amount y payment_status a partir de los abonos registrados. */
    public function recalculatePaymentStatus(): void
    {
        $paid = $this->payments()->sum('amount');
        $status = match (true) {
            $paid <= 0 => 'pending',
            $paid >= $this->amount => 'paid',
            default => 'partial',
        };

        $this->update(['paid_amount' => $paid, 'payment_status' => $status]);
    }
}
