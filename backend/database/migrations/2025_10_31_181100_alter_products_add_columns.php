<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products')) {
            return; // created by earlier migration
        }

        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('products', 'base_monthly_revenue')) {
                $table->decimal('base_monthly_revenue', 20, 2)->default(0)->after('description');
            }
            if (!Schema::hasColumn('products', 'upkeep')) {
                $table->decimal('upkeep', 20, 2)->default(0)->after('base_monthly_revenue');
            }
            if (!Schema::hasColumn('products', 'growth_rate')) {
                $table->decimal('growth_rate', 5, 4)->default(0.0000)->after('upkeep');
            }
            if (!Schema::hasColumn('products', 'active')) {
                $table->boolean('active')->default(true)->after('growth_rate');
            }
            if (!Schema::hasColumn('products', 'launched_at')) {
                $table->timestamp('launched_at')->nullable()->after('active');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('products')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'launched_at')) {
                $table->dropColumn('launched_at');
            }
            if (Schema::hasColumn('products', 'active')) {
                $table->dropColumn('active');
            }
            if (Schema::hasColumn('products', 'growth_rate')) {
                $table->dropColumn('growth_rate');
            }
            if (Schema::hasColumn('products', 'upkeep')) {
                $table->dropColumn('upkeep');
            }
            if (Schema::hasColumn('products', 'base_monthly_revenue')) {
                $table->dropColumn('base_monthly_revenue');
            }
            if (Schema::hasColumn('products', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};


