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
        Schema::create('npc_quests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('npc_id')->constrained()->onDelete('cascade');
            $table->string('quest_type'); // hire_employee, complete_project, launch_product, reach_level, etc.
            $table->text('title');
            $table->text('description');
            $table->json('requirements'); // e.g., {"count": 3, "target": "employee"}
            $table->integer('current_progress')->default(0);
            $table->integer('target_progress');
            $table->json('rewards'); // e.g., {"money": 10000, "reputation": 50, "xp": 100}
            $table->enum('status', ['active', 'completed', 'expired'])->default('active');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('npc_quests');
    }
};
