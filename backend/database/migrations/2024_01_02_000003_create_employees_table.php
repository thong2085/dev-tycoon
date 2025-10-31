<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('role'); // junior, mid, senior, lead, architect
            $table->integer('productivity')->default(100);
            $table->integer('skill_level')->default(1);
            $table->integer('salary')->default(0);
            $table->integer('energy')->default(100);
            $table->enum('status', ['working', 'idle', 'quit'])->default('idle');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};

