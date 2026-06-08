<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionController extends Controller
{
    public function index(Request $request): Response
    {
        $permissions = Permission::with('roles')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'roles' => $p->roles->pluck('name'),
            ]);

        return Inertia::render('admin/permissions/index', [
            'permissions' => $permissions,
            'roles' => Role::orderBy('name')->pluck('name'),
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
        ]);

        Permission::create(['name' => $data['name']]);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('success', 'Permiso creado correctamente.');
    }

    public function update(Request $request, Permission $permission): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', "unique:permissions,name,{$permission->id}"],
        ]);

        $permission->update(['name' => $data['name']]);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('success', 'Permiso actualizado correctamente.');
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        $permission->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('success', 'Permiso eliminado correctamente.');
    }
}
