<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('difficulty')->default(1); // 1-10
            $table->decimal('reward', 20, 2)->default(0);
            $table->integer('progress')->default(0); // 0-100
            $table->timestamp('started_at')->nullable();
            $table->timestamp('deadline')->nullable();
            $table->enum('status', ['queued', 'in_progress', 'completed', 'failed'])->default('queued');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};

