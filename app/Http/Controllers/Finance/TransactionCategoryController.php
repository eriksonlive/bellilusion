<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\TransactionCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = TransactionCategory::where('user_id', auth()->id())
            ->withCount('transactions')
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return Inertia::render('finance/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'type' => ['required', 'in:income,expense'],
        ]);

        TransactionCategory::create([
            ...$validated,
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Categoría creada.');
    }

    public function update(Request $request, TransactionCategory $transactionCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'type' => ['required', 'in:income,expense'],
        ]);

        $transactionCategory->update($validated);

        return back()->with('success', 'Categoría actualizada.');
    }

    public function destroy(TransactionCategory $transactionCategory): RedirectResponse
    {
        $transactionCategory->delete();

        return back()->with('success', 'Categoría eliminada.');
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
