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
        Schema::create('limited_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('permission_name'); // nombre igual al de Spatie
            $table->unsignedInteger('max_uses')->nullable(); // null = ilimitado
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('expires_at')->nullable(); // null = sin fecha límite
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('limited_permissions');
    }
};
