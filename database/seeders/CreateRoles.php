<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CreateRoles extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::create(['name' => 'admin']);
        $managerRole = Role::create(['name' => 'employee']);
        $userRole = Role::create(['name' => 'user']);

        Permission::create(['name' => 'Administrator']);
        Permission::create(['name' => 'assign teams']);
        Permission::create(['name' => 'assign roles']);
        Permission::create(['name' => 'assign permissions']);

        // Asignar permisos a roles
        $adminRole->givePermissionTo(['Administrator', 'assign teams', 'assign roles', 'assign permissions']);
    }
}
