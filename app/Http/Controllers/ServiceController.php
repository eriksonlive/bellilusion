<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Service::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%")
                ->orWhere('description', 'like', "%{$request->search}%");
        }

        if ($request->filled('active')) {
            $query->where('active', $request->active === 'true');
        }

        $services = $query->withCount('appointments')
            ->orderBy('active', 'desc')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('services/index', [
            'services' => $services,
            'filters' => $request->only(['search', 'active']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'duration_minutes' => ['nullable', 'integer', 'min:5', 'max:480'],
            'price' => ['required', 'numeric', 'min:0'],
            'active' => ['boolean'],
        ]);

        Service::create($validated);

        return back()->with('success', 'Servicio creado exitosamente.');
    }

    public function update(Request $request, Service $service): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'duration_minutes' => ['nullable', 'integer', 'min:5', 'max:480'],
            'price' => ['required', 'numeric', 'min:0'],
            'active' => ['boolean'],
        ]);

        $service->update($validated);

        return back()->with('success', 'Servicio actualizado.');
    }

    public function destroy(Service $service): RedirectResponse
    {
        $service->delete();

        return back()->with('success', 'Servicio eliminado.');
    }

    public function create() {}

    public function show(string $id) {}

    public function edit(string $id) {}
}
