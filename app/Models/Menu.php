<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Permission;

class Menu extends Model
{
    protected $fillable = [
        'label',
        'href',
        'icon',
        'parent_id',
        'order',
        'permission'
    ];

    public function children()
    {
        return $this->hasMany(Menu::class, 'parent_id')->with('children');
    }

    public function parent()
    {
        return $this->belongsTo(Menu::class, 'parent_id');
    }

    // Relación con un permiso específico
    public function permission()
    {
        return $this->belongsTo(Permission::class, 'permission_name', 'name');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'menu_permission');
    }
}
