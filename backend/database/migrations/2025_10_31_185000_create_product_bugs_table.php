<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_bugs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('title'); // e.g. "Critical Database Connection Issue"
            $table->text('description'); // Detailed description
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->decimal('revenue_penalty', 5, 2)->default(10.00); // Percentage reduction (10% = 0.10)
            $table->integer('fix_cost')->default(0); // Cost to fix in money
            $table->integer('fix_time_minutes')->default(5); // Time to fix in minutes
            $table->enum('status', ['active', 'fixing', 'fixed'])->default('active');
            $table->timestamp('discovered_at');
            $table->timestamp('fix_started_at')->nullable();
            $table->timestamp('fixed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_bugs');
    }
};

