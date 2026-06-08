<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::create([
            'name' => 'Administrador',
            'email' => 'm@m.com',
            'password' => Hash::make('root'),
        ]);

        $user->assignRole('admin');

        // LimitedPermission::create([
        //     'user_id' => 5, // ID del usuario
        //     'permission_name' => 'edit special content',
        //     'max_uses' => 3, // solo 3 veces
        //     'expires_at' => Carbon::now()->addDays(7), // expira en 7 días
        // ]);

        // $user = \App\Models\User::find(5);
        // $user->givePermissionTo('edit special content');
    }
}
