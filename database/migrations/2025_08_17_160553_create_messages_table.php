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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->onDelete('cascade'); // ticket al que pertenece
            $table->foreignId('user_id')->constrained()->onDelete('cascade');   // usuario que envía el mensaje
            $table->text('content'); // mensaje en texto
            $table->enum('type', ['user', 'agent', 'system'])->default('user'); // opcional: tipo de mensaje
            $table->boolean('read')->default(false); // opcional: si fue leído
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
