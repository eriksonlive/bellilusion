<?php

use App\Http\Controllers\Finance\TransactionCategoryController;
use App\Http\Controllers\Finance\TransactionController;
use App\Http\Controllers\Finance\TransactionPaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('finance', [TransactionController::class, 'index'])->name('finance.index');
    Route::post('finance', [TransactionController::class, 'store'])->name('finance.store');
    Route::put('finance/{transaction}', [TransactionController::class, 'update'])->name('finance.update');
    Route::delete('finance/{transaction}', [TransactionController::class, 'destroy'])->name('finance.destroy');

    // Abonos
    Route::post('finance/{transaction}/payments', [TransactionPaymentController::class, 'store'])->name('finance.payments.store');
    Route::delete('finance/{transaction}/payments/{payment}', [TransactionPaymentController::class, 'destroy'])->name('finance.payments.destroy');

    Route::get('finance/categories', [TransactionCategoryController::class, 'index'])->name('finance.categories.index');
    Route::post('finance/categories', [TransactionCategoryController::class, 'store'])->name('finance.categories.store');
    Route::put('finance/categories/{transactionCategory}', [TransactionCategoryController::class, 'update'])->name('finance.categories.update');
    Route::delete('finance/categories/{transactionCategory}', [TransactionCategoryController::class, 'destroy'])->name('finance.categories.destroy');
});
