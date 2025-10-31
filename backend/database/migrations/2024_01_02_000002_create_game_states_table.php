<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('company_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('money', 20, 2)->default(0);
            $table->decimal('click_power', 12, 2)->default(1);
            $table->decimal('auto_income', 12, 2)->default(0);
            $table->integer('xp')->default(0);
            $table->integer('level')->default(1);
            $table->json('upgrades')->nullable();
            $table->timestamp('last_active')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_states');
    }
};

