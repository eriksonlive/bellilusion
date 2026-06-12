<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('offline', function () {
    return view('offline');
})->name('offline');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Notificaciones
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::delete('notifications', [NotificationController::class, 'destroyAll'])->name('notifications.destroy-all');
});

require __DIR__.'/pos.php';
require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
require __DIR__.'/agenda.php';
require __DIR__.'/finance.php';
require __DIR__.'/clients.php';
require __DIR__.'/auth.php';
