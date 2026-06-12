<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use App\Models\TransactionItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Transaction::with(['category', 'items', 'appointment.client', 'payments'])
            ->where('user_id', auth()->id());

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('category_id')) {
            $query->where('transaction_category_id', $request->category_id);
        }

        if ($request->filled('month') && $request->filled('year')) {
            $query->whereYear('date', $request->year)->whereMonth('date', $request->month);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        $transactions = $query->orderBy('date', 'desc')->orderBy('created_at', 'desc')->paginate(20)->withQueryString()
            ->through(fn (Transaction $t) => [
                'id' => $t->id,
                'type' => $t->type,
                'amount' => (float) $t->amount,
                'paid_amount' => (float) $t->paid_amount,
                'payment_status' => $t->payment_status,
                'description' => $t->description,
                'date' => $t->date?->format('Y-m-d'),
                'notes' => $t->notes,
                'appointment_id' => $t->appointment_id,
                'transaction_category_id' => $t->transaction_category_id,
                'category' => $t->category ? ['id' => $t->category->id, 'name' => $t->category->name, 'color' => $t->category->color, 'type' => $t->category->type] : null,
                'items' => $t->items->map(fn ($i) => [
                    'id' => $i->id,
                    'type' => $i->type,
                    'name' => $i->name,
                    'unit_price' => (float) $i->unit_price,
                    'quantity' => $i->quantity,
                    'subtotal' => (float) $i->subtotal,
                    'note' => $i->note,
                ]),
                'payments' => $t->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'date' => $p->date?->format('Y-m-d'),
                    'notes' => $p->notes,
                ]),
                'client_name' => $t->appointment?->client?->name,
            ]);

        $categories = TransactionCategory::where('user_id', auth()->id())
            ->orderBy('type')->orderBy('name')
            ->get(['id', 'name', 'color', 'type']);

        // Para el selector de ítems en ingreso manual
        $services = Service::where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'price']);

        $products = Product::where('user_id', auth()->id())
            ->where('active', true)
            ->where('stock', '>', 0)
            ->orderBy('name')
            ->get(['id', 'name', 'price', 'stock']);

        $currentMonth = now()->month;
        $currentYear = now()->year;

        $monthlyIncome = Transaction::where('user_id', auth()->id())
            ->where('type', 'income')
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->sum('amount');

        $monthlyExpense = Transaction::where('user_id', auth()->id())
            ->where('type', 'expense')
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->sum('amount');

        $totalPending = Transaction::where('user_id', auth()->id())
            ->where('payment_status', '!=', 'paid')
            ->sum(DB::raw('amount - paid_amount'));

        return Inertia::render('finance/index', [
            'transactions' => $transactions,
            'categories' => $categories,
            'services' => $services,
            'products' => $products,
            'summary' => [
                'monthly_income' => (float) $monthlyIncome,
                'monthly_expense' => (float) $monthlyExpense,
                'monthly_balance' => (float) ($monthlyIncome - $monthlyExpense),
                'total_pending' => (float) $totalPending,
            ],
            'filters' => $request->only(['type', 'category_id', 'month', 'year', 'payment_status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'transaction_category_id' => ['nullable', 'exists:transaction_categories,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'payment_status' => ['nullable', 'in:paid,partial,pending'],
            'items' => ['nullable', 'array'],
            'items.*.type' => ['required_with:items', 'in:service,product'],
            'items.*.name' => ['required_with:items', 'string', 'max:255'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.note' => ['nullable', 'string', 'max:255'],
        ]);

        $paymentStatus = $validated['payment_status'] ?? 'paid';
        $paidAmount = $paymentStatus === 'paid' ? $validated['amount'] : 0;

        $transaction = Transaction::create([
            'user_id' => auth()->id(),
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'date' => $validated['date'],
            'transaction_category_id' => $validated['transaction_category_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'payment_status' => $paymentStatus,
            'paid_amount' => $paidAmount,
        ]);

        if (! empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $qty = (int) $item['quantity'];
                $price = (float) $item['unit_price'];
                $subtotal = round($price * $qty, 2);

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'type' => $item['type'],
                    'name' => $item['name'],
                    'unit_price' => $price,
                    'quantity' => $qty,
                    'subtotal' => $subtotal,
                    'note' => $item['note'] ?? null,
                ]);

                // Descontar stock si es producto
                if ($item['type'] === 'product') {
                    Product::where('user_id', auth()->id())
                        ->where('name', $item['name'])
                        ->decrement('stock', $qty);
                }
            }
        }

        return back()->with('success', 'Transacción registrada.');
    }

    public function update(Request $request, Transaction $transaction): RedirectResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);

        $validated = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'transaction_category_id' => ['nullable', 'exists:transaction_categories,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'payment_status' => ['nullable', 'in:paid,partial,pending'],
            'items' => ['nullable', 'array'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.type' => ['required_with:items', 'in:service,product'],
            'items.*.name' => ['required_with:items', 'string', 'max:255'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.note' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction->update([
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'date' => $validated['date'],
            'transaction_category_id' => $validated['transaction_category_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Actualizar ítems si se enviaron
        if (isset($validated['items'])) {
            // Restaurar stock de productos eliminados
            $oldProductItems = $transaction->items()->where('type', 'product')->get();
            foreach ($oldProductItems as $old) {
                Product::where('user_id', $transaction->user_id)
                    ->where('name', $old->name)
                    ->increment('stock', $old->quantity);
            }

            $transaction->items()->delete();

            foreach ($validated['items'] as $item) {
                $qty = (int) $item['quantity'];
                $price = (float) $item['unit_price'];
                $subtotal = round($price * $qty, 2);

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'type' => $item['type'],
                    'name' => $item['name'],
                    'unit_price' => $price,
                    'quantity' => $qty,
                    'subtotal' => $subtotal,
                    'note' => $item['note'] ?? null,
                ]);

                if ($item['type'] === 'product') {
                    Product::where('user_id', $transaction->user_id)
                        ->where('name', $item['name'])
                        ->decrement('stock', $qty);
                }
            }

            // Recalcular el total a partir de los ítems
            $newTotal = collect($validated['items'])->sum(fn ($i) => (float) $i['unit_price'] * (int) $i['quantity']);
            if ($newTotal > 0) {
                $transaction->update(['amount' => $newTotal]);
            }
        }

        // Recalcular estado de pago si tiene abonos o se cambió el estado manualmente
        if (isset($validated['payment_status']) && $transaction->payments()->count() === 0) {
            $paidAmount = $validated['payment_status'] === 'paid' ? $transaction->amount : $transaction->paid_amount;
            $transaction->update([
                'payment_status' => $validated['payment_status'],
                'paid_amount' => $paidAmount,
            ]);
        } else {
            $transaction->recalculatePaymentStatus();
        }

        return back()->with('success', 'Transacción actualizada.');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);

        $transaction->delete();

        return back()->with('success', 'Transacción eliminada.');
    }
}
