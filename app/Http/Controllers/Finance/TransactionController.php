<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Transaction::with('category')
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

        $transactions = $query->orderBy('date', 'desc')->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        $categories = TransactionCategory::where('user_id', auth()->id())
            ->orderBy('type')->orderBy('name')
            ->get(['id', 'name', 'color', 'type']);

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

        return Inertia::render('finance/index', [
            'transactions' => $transactions,
            'categories' => $categories,
            'summary' => [
                'monthly_income' => (float) $monthlyIncome,
                'monthly_expense' => (float) $monthlyExpense,
                'monthly_balance' => (float) ($monthlyIncome - $monthlyExpense),
            ],
            'filters' => $request->only(['type', 'category_id', 'month', 'year']),
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
        ]);

        Transaction::create([
            ...$validated,
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Transacción registrada.');
    }

    public function update(Request $request, Transaction $transaction): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'transaction_category_id' => ['nullable', 'exists:transaction_categories,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $transaction->update($validated);

        return back()->with('success', 'Transacción actualizada.');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        $transaction->delete();

        return back()->with('success', 'Transacción eliminada.');
    }

    public function create()
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }
}
