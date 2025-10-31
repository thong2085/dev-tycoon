<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "React", "Laravel"
            $table->string('category'); // Frontend, Backend, Mobile, AI, DevOps
            $table->text('description')->nullable();
            $table->string('icon')->default('💻');
            $table->decimal('base_unlock_cost', 20, 2)->default(100);
            $table->decimal('upgrade_multiplier', 8, 2)->default(1.5); // Cost multiplier per level
            $table->integer('max_level')->default(10);
            $table->json('project_types')->nullable(); // Which project types this skill helps with
            $table->decimal('efficiency_bonus', 8, 2)->default(0.10); // 10% bonus per level
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};

