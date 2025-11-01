<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Check if table exists but is missing columns
        if (Schema::hasTable('researches')) {
            Schema::table('researches', function (Blueprint $table) {
                if (!Schema::hasColumn('researches', 'key')) {
                    $table->string('key')->unique();
                }
                if (!Schema::hasColumn('researches', 'name')) {
                    $table->string('name');
                }
                if (!Schema::hasColumn('researches', 'description')) {
                    $table->text('description')->nullable();
                }
                if (!Schema::hasColumn('researches', 'category')) {
                    $table->string('category');
                }
                if (!Schema::hasColumn('researches', 'cost')) {
                    $table->decimal('cost', 20, 2)->default(0);
                }
                if (!Schema::hasColumn('researches', 'required_level')) {
                    $table->integer('required_level')->default(1);
                }
                if (!Schema::hasColumn('researches', 'effects')) {
                    $table->json('effects')->nullable();
                }
                if (!Schema::hasColumn('researches', 'icon')) {
                    $table->string('icon')->default('🔬');
                }
                // Fix legacy columns that shouldn't be here
                if (Schema::hasColumn('researches', 'company_id')) {
                    $table->unsignedBigInteger('company_id')->nullable()->change();
                }
                if (Schema::hasColumn('researches', 'tech_name')) {
                    $table->string('tech_name')->nullable()->change();
                }
            });
        } else {
            // Create table if it doesn't exist
            Schema::create('researches', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category');
                $table->decimal('cost', 20, 2)->default(0);
                $table->integer('required_level')->default(1);
                $table->json('effects')->nullable();
                $table->string('icon')->default('🔬');
                $table->timestamps();
            });
        }

        // Create user_researches pivot table if it doesn't exist
        if (!Schema::hasTable('user_researches')) {
            Schema::create('user_researches', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('research_id')->constrained('researches')->onDelete('cascade');
                $table->timestamp('unlocked_at')->nullable();
                $table->timestamps();
                
                $table->unique(['user_id', 'research_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_researches');
        // Don't drop researches table as it might have data
    }
};

