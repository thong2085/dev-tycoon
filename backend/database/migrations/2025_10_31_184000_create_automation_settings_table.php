<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automation_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->boolean('auto_rest_enabled')->default(false);
            $table->integer('auto_rest_energy_threshold')->default(30); // Rest when energy < 30%
            $table->integer('auto_rest_morale_threshold')->default(30); // Rest when morale < 30%
            $table->boolean('auto_assign_enabled')->default(false);
            $table->integer('auto_assign_min_energy')->default(50); // Only assign if energy >= 50%
            $table->integer('auto_assign_min_morale')->default(50); // Only assign if morale >= 50%
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_settings');
    }
};

