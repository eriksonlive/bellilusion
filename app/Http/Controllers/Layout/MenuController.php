<?php

namespace App\Http\Controllers\Layout;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class MenuController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $req)
    {
        $permissions = Permission::all();

        $routes = collect(Route::getRoutes())->filter(function ($route) {
            return in_array('web', $route->gatherMiddleware());
        })->map(function ($route) {
            return [
                'method' => implode('|', $route->methods()),
                'uri' => $route->uri(),
                'name' => $route->getName(),
                'action' => $route->getActionName(),
            ];
        })->values()->all();

        $query = Menu::with(['children', 'parent', 'permissions']);

        if ($req->filled('search')) {
            $query->where('label', 'like', '%'.$req->search.'%');
        }

        // 🔍 Filtro por permiso
        if ($req->filled('permission')) {
            $query->where('permission', $req->permission);
        }

        // 🔍 Filtro por ID de padre
        if ($req->filled('parent_id')) {
            $query->where('parent_id', $req->parent_id);
        }

        $perPage = in_array((int) $req->per_page, [10, 25, 50, 100]) ? (int) $req->per_page : 10;
        $menus = $query->orderBy('order')->paginate($perPage)->withQueryString();

        $filters = $req->only('search', 'permission', 'parent_id', 'per_page');
        $parents = Menu::whereNull('parent_id')->orderBy('label')->get(['id', 'label']);

        return Inertia::render('layouts/menu/index', compact('menus', 'permissions', 'routes', 'filters', 'parents'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'href' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:menus,id',
            'order' => 'nullable|numeric',
            'permission' => 'nullable|string|max:255',
        ]);

        $validated['order'] = (int) $validated['order'];
        $validated['href'] = $validated['href'] ?: null;
        $validated['permission'] = $validated['permission'] ?: null;

        Menu::create($validated);

        return back()->with('success', 'Menú creado correctamente');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'href' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:menus,id',
            'order' => 'nullable|numeric',
            'permission' => 'nullable|string|max:255',
        ]);

        $validated['order'] = (int) ($validated['order'] ?? 0);
        $validated['href'] = $validated['href'] ?: null;
        $validated['permission'] = $validated['permission'] ?: null;

        $menu->update($validated);

        return back()->with('success', 'Menú actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Menu $menu)
    {
        $menu->delete();

        return back()->with('success', 'Menú eliminado');
    }
}
