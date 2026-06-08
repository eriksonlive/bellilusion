<?php

use App\Http\Controllers\Layout\MenuController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    // Route::get('admin/menus', [MenuController::class, 'index'])->name('menu');

    Route::resource('admin/menus', MenuController::class);
});
