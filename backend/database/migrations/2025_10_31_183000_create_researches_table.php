<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('researches')) {
            return; // Table already exists, skip
        }
        
        Schema::create('researches', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g. 'product_growth_boost'
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category'); // product, employee, project, company
            $table->decimal('cost', 20, 2)->default(0);
            $table->integer('required_level')->default(1); // Company level required
            $table->json('effects')->nullable(); // {product_growth: 0.1, upkeep_reduction: 0.1}
            $table->string('icon')->default('🔬');
            $table->timestamps();
        });

        Schema::create('user_researches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('research_id')->constrained()->onDelete('cascade');
            $table->timestamp('unlocked_at')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'research_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_researches');
        Schema::dropIfExists('researches');
    }
};

