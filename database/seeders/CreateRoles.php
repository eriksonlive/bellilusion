<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CreateRoles extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Admin
            'admin.users',
            'admin.roles',
            'admin.permissions',
            // Agenda
            'agenda.view',
            'agenda.create',
            'agenda.edit',
            'agenda.delete',
            // Clientes
            'clients.view',
            'clients.create',
            'clients.edit',
            'clients.delete',
            // Servicios
            'services.view',
            'services.create',
            'services.edit',
            'services.delete',
            // Finanzas
            'finance.view',
            'finance.create',
            'finance.edit',
            'finance.delete',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $employee = Role::firstOrCreate(['name' => 'employee']);
        Role::firstOrCreate(['name' => 'user']);

        $admin->syncPermissions($permissions);

        $employee->syncPermissions([
            'agenda.view', 'agenda.create', 'agenda.edit',
            'clients.view', 'clients.create', 'clients.edit',
            'services.view',
            'finance.view',
        ]);
    }
}
