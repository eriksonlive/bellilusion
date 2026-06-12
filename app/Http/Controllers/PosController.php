<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Product;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use App\Models\TransactionItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $services = Service::where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'price', 'duration_minutes']);

        $products = Product::where('user_id', $user->id)
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'price', 'stock']);

        $clients = Client::where('user_id', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email']);

        $categories = TransactionCategory::where('user_id', $user->id)
            ->where('type', 'income')
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return Inertia::render('pos/index', compact('services', 'products', 'clients', 'categories'));
    }

    public function sale(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.type' => ['required', 'in:service,product'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.note' => ['nullable', 'string', 'max:255'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'payment_method' => ['required', 'in:cash,card,transfer,credit'],
            'cash_received' => ['nullable', 'numeric', 'min:0'],
            'transaction_category_id' => ['nullable', 'exists:transaction_categories,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'date' => ['required', 'date'],
            'discount_global' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $user = auth()->user();
        $items = collect($validated['items']);
        $globalDiscount = (float) ($validated['discount_global'] ?? 0);

        // Calcular subtotales con descuentos por ítem
        $lineItems = $items->map(function ($item) {
            $itemDiscount = (float) ($item['discount'] ?? 0);
            $basePrice = (float) $item['unit_price'] * (int) $item['quantity'];
            $discountAmt = round($basePrice * $itemDiscount / 100, 2);

            return array_merge($item, [
                'base_subtotal' => $basePrice,
                'discount_amount' => $discountAmt,
                'final_subtotal' => round($basePrice - $discountAmt, 2),
            ]);
        });

        $subtotalBeforeGlobal = $lineItems->sum('final_subtotal');
        $globalDiscountAmt = round($subtotalBeforeGlobal * $globalDiscount / 100, 2);
        $total = round($subtotalBeforeGlobal - $globalDiscountAmt, 2);

        $paymentStatus = $validated['payment_method'] === 'credit' ? 'pending' : 'paid';
        $paidAmount = $paymentStatus === 'paid' ? $total : 0;

        // Construir descripción
        $clientName = $validated['client_id']
            ? Client::find($validated['client_id'])?->name
            : null;

        $itemNames = $lineItems->take(3)->pluck('name')->implode(', ');
        $description = $clientName ? "Venta POS — {$clientName}" : 'Venta POS';
        if ($itemNames) {
            $description .= ": {$itemNames}";
            if ($lineItems->count() > 3) {
                $description .= '...';
            }
        }

        $transaction = Transaction::create([
            'user_id' => $user->id,
            'transaction_category_id' => $validated['transaction_category_id'] ?? null,
            'type' => 'income',
            'amount' => $total,
            'paid_amount' => $paidAmount,
            'payment_status' => $paymentStatus,
            'description' => mb_substr($description, 0, 255),
            'date' => $validated['date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Crear ítems y descontar stock
        $receiptItems = [];
        foreach ($lineItems as $item) {
            TransactionItem::create([
                'transaction_id' => $transaction->id,
                'type' => $item['type'],
                'name' => $item['name'],
                'unit_price' => (float) $item['unit_price'],
                'quantity' => (int) $item['quantity'],
                'subtotal' => $item['final_subtotal'],
                'note' => $item['note'] ?? null,
            ]);

            if ($item['type'] === 'product') {
                Product::where('user_id', $user->id)
                    ->where('name', $item['name'])
                    ->decrement('stock', (int) $item['quantity']);
            }

            $receiptItems[] = [
                'type' => $item['type'],
                'name' => $item['name'],
                'unit_price' => (float) $item['unit_price'],
                'quantity' => (int) $item['quantity'],
                'discount' => (float) ($item['discount'] ?? 0),
                'final_subtotal' => $item['final_subtotal'],
                'note' => $item['note'] ?? null,
            ];
        }

        $cashReceived = (float) ($validated['cash_received'] ?? 0);
        $change = $validated['payment_method'] === 'cash' && $cashReceived > 0
            ? max(0, $cashReceived - $total)
            : null;

        $receipt = [
            'transaction_id' => $transaction->id,
            'date' => $validated['date'],
            'client_name' => $clientName,
            'items' => $receiptItems,
            'subtotal' => $subtotalBeforeGlobal,
            'discount_global' => $globalDiscountAmt,
            'total' => $total,
            'payment_method' => $validated['payment_method'],
            'payment_status' => $paymentStatus,
            'cash_received' => $cashReceived ?: null,
            'change' => $change,
        ];

        return back()->with('receipt', $receipt)->with('success', 'Venta registrada correctamente.');
    }
}
