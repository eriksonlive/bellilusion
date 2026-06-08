<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Layout\MenuController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', UserController::class)->except(['show', 'create', 'edit']);
    Route::resource('roles', RoleController::class)->except(['show', 'create', 'edit']);
    Route::resource('permissions', PermissionController::class)->except(['show', 'create', 'edit']);
    Route::resource('menus', MenuController::class);
});
