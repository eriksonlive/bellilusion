<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TransactionPaymentController extends Controller
{
    public function store(Request $request, Transaction $transaction): RedirectResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction->payments()->create([
            'user_id' => auth()->id(),
            'amount' => $validated['amount'],
            'date' => $validated['date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $transaction->recalculatePaymentStatus();

        return back()->with('success', 'Abono registrado correctamente.');
    }

    public function destroy(Transaction $transaction, TransactionPayment $payment): RedirectResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);

        abort_if($payment->transaction_id !== $transaction->id, 403);

        $payment->delete();
        $transaction->recalculatePaymentStatus();

        return back()->with('success', 'Abono eliminado.');
    }
}
