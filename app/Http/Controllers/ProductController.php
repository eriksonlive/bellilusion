<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $req): Response
    {
        $query = Product::where('user_id', auth()->id());

        if ($req->filled('search')) {
            $query->where('name', 'like', '%'.$req->search.'%');
        }

        if ($req->filled('active')) {
            $query->where('active', $req->active === '1');
        }

        $perPage = in_array((int) $req->per_page, [10, 25, 50, 100]) ? (int) $req->per_page : 15;
        $products = $query->orderBy('name')->paginate($perPage)->withQueryString();
        $filters = $req->only(['search', 'active', 'per_page']);

        return Inertia::render('products/index', compact('products', 'filters'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'active' => ['boolean'],
        ]);

        Product::create([...$validated, 'user_id' => auth()->id()]);

        return back()->with('success', 'Producto creado.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'active' => ['boolean'],
        ]);

        $product->update($validated);

        return back()->with('success', 'Producto actualizado.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return back()->with('success', 'Producto eliminado.');
    }
}
