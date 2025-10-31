<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products')) {
            return; // created by previous migration
        }

        if (!Schema::hasColumn('products', 'user_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });

            // Backfill user_id from company relation if possible
            DB::statement('UPDATE products p JOIN companies c ON p.company_id = c.id SET p.user_id = c.user_id WHERE p.user_id IS NULL');
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'user_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropConstrainedForeignId('user_id');
            });
        }
    }
};


