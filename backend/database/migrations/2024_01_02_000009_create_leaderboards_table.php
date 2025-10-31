<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('rank')->default(0);
            $table->decimal('score', 20, 2)->default(0); // total money earned
            $table->timestamps();
            
            $table->index('rank');
            $table->index('score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboards');
    }
};

