<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'first_click', 'millionaire'
            $table->string('name');
            $table->text('description');
            $table->string('icon')->default('🏆');
            $table->string('category'); // money, level, projects, employees, skills, special
            $table->integer('requirement_value'); // e.g., 1000000 for millionaire
            $table->string('requirement_type'); // money, level, projects, employees, etc.
            $table->integer('reward_money')->default(0);
            $table->integer('reward_xp')->default(0);
            $table->integer('reward_prestige_points')->default(0);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('achievement_id')->constrained()->onDelete('cascade');
            $table->timestamp('unlocked_at');
            $table->boolean('notified')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'achievement_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_achievements');
        Schema::dropIfExists('achievements');
    }
};

