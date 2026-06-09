<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenusSeeder extends Seeder
{
    public function run(): void
    {
        Menu::query()->delete();

        // ── Nivel raíz ────────────────────────────────────────────────────────
        Menu::create([
            'label' => 'Dashboard',
            'href' => '/dashboard',
            'icon' => 'LayoutGrid',
            'parent_id' => null,
            'order' => 1,
            'permission' => null,
        ]);

        Menu::create([
            'label' => 'Agenda',
            'href' => '/agenda',
            'icon' => 'AlarmClock',
            'parent_id' => null,
            'order' => 2,
            'permission' => null,
        ]);

        Menu::create([
            'label' => 'Finanzas',
            'href' => '/finance',
            'icon' => 'fa:FaMoneyBillAlt',
            'parent_id' => null,
            'order' => 3,
            'permission' => null,
        ]);

        Menu::create([
            'label' => 'Clientes',
            'href' => '/clients',
            'icon' => 'fa:FaUserFriends',
            'parent_id' => null,
            'order' => 4,
            'permission' => null,
        ]);

        Menu::create([
            'label' => 'Servicios',
            'href' => '/services',
            'icon' => 'lia:LiaServicestack',
            'parent_id' => null,
            'order' => 5,
            'permission' => null,
        ]);

        // Grupo Admin (solo visible para el rol admin)
        $admin = Menu::create([
            'label' => 'Admin',
            'href' => null,
            'icon' => 'Cog',
            'parent_id' => null,
            'order' => 6,
            'permission' => 'admin',
        ]);

        // ── Hijos de Admin ────────────────────────────────────────────────────
        Menu::create([
            'label' => 'Usuarios',
            'href' => '/admin/users',
            'icon' => 'Users',
            'parent_id' => $admin->id,
            'order' => 1,
            'permission' => 'admin',
        ]);

        Menu::create([
            'label' => 'Menús',
            'href' => '/admin/menus',
            'icon' => 'LayoutList',
            'parent_id' => $admin->id,
            'order' => 2,
            'permission' => 'admin',
        ]);
    }
}
