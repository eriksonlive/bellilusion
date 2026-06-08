<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenusSeeder extends Seeder
{
    public function run(): void
    {
        Menu::updateOrCreate(
            ['label' => 'Dashboard'],
            [
                'label' => 'Dashboard',
                'href' => '/dashboard',
                'icon' => 'dashboard',
                'parent_id' => null,
                'order' => 0,
                'permission' => null,
            ]
        );

        $admin = Menu::updateOrCreate(
            ['label' => 'Admin'],
            [
                'label' => 'Admin',
                'href' => null,
                'icon' => 'admin',
                'parent_id' => null,
                'order' => 0,
                'permission' => 'Administrator',
            ]
        );

        $adminMenus = [
            [
                'label' => 'Equipos',
                'href' => '/admin/teams',
                'icon' => null,
                'order' => 3,
                'permission' => null,
            ],
            [
                'label' => 'Menus',
                'href' => '/admin/menus',
                'icon' => 'menus',
                'order' => 2,
                'permission' => 'Administrator',
            ],
            [
                'label' => 'Usuarios',
                'href' => '/admin/users',
                'icon' => 'users',
                'order' => 1,
                'permission' => 'Administrator',
            ],
        ];

        foreach ($adminMenus as $menu) {
            Menu::updateOrCreate(
                ['label' => $menu['label']],
                [
                    ...$menu,
                    'parent_id' => $admin->id,
                ]
            );
        }
    }
}
