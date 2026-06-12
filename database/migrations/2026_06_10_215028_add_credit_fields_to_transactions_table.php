<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('payment_status')->default('paid')->after('notes'); // paid | partial | pending
            $table->decimal('paid_amount', 12, 2)->default(0)->after('payment_status');
        });

        // Marcar todas las transacciones existentes como pagadas
        DB::table('transactions')->update([
            'payment_status' => 'paid',
            'paid_amount' => DB::raw('amount'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'paid_amount']);
        });
    }
};
