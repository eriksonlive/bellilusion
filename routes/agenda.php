<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AvailabilitySlotController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('agenda', [AppointmentController::class, 'index'])->name('agenda.index');
    Route::post('agenda', [AppointmentController::class, 'store'])->name('agenda.store');
    Route::put('agenda/{appointment}', [AppointmentController::class, 'update'])->name('agenda.update');
    Route::delete('agenda/{appointment}', [AppointmentController::class, 'destroy'])->name('agenda.destroy');

    Route::get('slots/available', [AvailabilitySlotController::class, 'available'])->name('slots.available');
});
