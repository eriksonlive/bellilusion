<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;

class AppointmentIncomeService
{
    /**
     * Genera (o regenera) el ingreso vinculado a una cita completada.
     * Si ya existe un ingreso anterior, restaura el stock de los productos
     * vendidos y luego aplica las nuevas cantidades.
     */
    public function generate(Appointment $appointment, ?int $categoryId = null): Transaction
    {
        $appointment->loadMissing(['client', 'services', 'products', 'slot']);

        // Si ya había un ingreso previo, restaurar el stock de los productos antes de borrar
        $existingTransaction = Transaction::with('items')
            ->where('appointment_id', $appointment->id)
            ->first();

        if ($existingTransaction) {
            foreach ($existingTransaction->items->where('type', 'product') as $item) {
                Product::where('name', $item->name)
                    ->where('user_id', $appointment->user_id)
                    ->increment('stock', $item->quantity);
            }
            $existingTransaction->delete();
        }

        // Construir ítems de servicios
        $serviceItems = $appointment->services->map(fn ($s) => [
            'type' => 'service',
            'name' => $s->name,
            'unit_price' => (float) $s->pivot->price,
            'quantity' => $s->pivot->quantity,
            'subtotal' => (float) $s->pivot->price * $s->pivot->quantity,
        ]);

        // Construir ítems de productos
        $productItems = $appointment->products->map(fn ($p) => [
            'type' => 'product',
            'product_id' => $p->id,
            'name' => $p->name,
            'unit_price' => (float) $p->pivot->price,
            'quantity' => $p->pivot->quantity,
            'subtotal' => (float) $p->pivot->price * $p->pivot->quantity,
        ]);

        $allItems = $serviceItems->concat($productItems);
        $total = $allItems->sum('subtotal');

        $clientName = $appointment->client?->name ?? 'Sin cliente';
        $serviceList = $serviceItems->pluck('name')->implode(', ');
        $description = "Cita: {$clientName}".($serviceList ? " — {$serviceList}" : '');
        $date = $appointment->slot?->date?->format('Y-m-d') ?? now()->format('Y-m-d');

        $transaction = Transaction::create([
            'user_id' => $appointment->user_id,
            'appointment_id' => $appointment->id,
            'transaction_category_id' => $categoryId,
            'type' => 'income',
            'amount' => $total,
            'description' => $description,
            'date' => $date,
            'notes' => $this->buildNotesBreakdown($serviceItems->toArray(), $productItems->toArray()),
        ]);

        foreach ($allItems as $item) {
            TransactionItem::create([
                'transaction_id' => $transaction->id,
                'type' => $item['type'],
                'name' => $item['name'],
                'unit_price' => $item['unit_price'],
                'quantity' => $item['quantity'],
                'subtotal' => $item['subtotal'],
            ]);
        }

        // Descontar stock de los productos vendidos
        foreach ($productItems as $item) {
            Product::where('id', $item['product_id'])
                ->decrement('stock', $item['quantity']);
        }

        return $transaction;
    }

    private function buildNotesBreakdown(array $services, array $products): string
    {
        $lines = [];

        if (! empty($services)) {
            $lines[] = 'SERVICIOS:';
            foreach ($services as $s) {
                $lines[] = "  · {$s['name']} × {$s['quantity']} = $".number_format($s['subtotal'], 2);
            }
        }

        if (! empty($products)) {
            $lines[] = 'PRODUCTOS:';
            foreach ($products as $p) {
                $lines[] = "  · {$p['name']} × {$p['quantity']} = $".number_format($p['subtotal'], 2);
            }
        }

        return implode("\n", $lines);
    }
}
