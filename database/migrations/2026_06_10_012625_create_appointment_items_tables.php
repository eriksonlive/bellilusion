<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Pivot: cita ↔ servicios (varios servicios por cita)
        Schema::create('appointment_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 10, 2)->default(0);  // precio al momento de la cita
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });

        // Pivot: cita ↔ productos (varios productos por cita)
        Schema::create('appointment_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 10, 2)->default(0);  // precio al momento de la cita
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_products');
        Schema::dropIfExists('appointment_services');
    }
};
