<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        try {
            // Check if users table exists before altering
            if (Schema::hasTable('users')) {
                Schema::table('users', function (Blueprint $table) {
                    // Check if columns don't exist before adding
                    if (!Schema::hasColumn('users', 'level')) {
                        $table->integer('level')->default(1)->after('password');
                    }
                    if (!Schema::hasColumn('users', 'prestige_points')) {
                        $table->integer('prestige_points')->default(0)->after('level');
                    }
                    if (!Schema::hasColumn('users', 'last_active')) {
                        $table->timestamp('last_active')->nullable()->after('prestige_points');
                    }
                });
            }
        } catch (\Exception $e) {
            // If table doesn't exist or other error, migration will be skipped
            // The table will be created by create_users_table migration first
        }
    }

    public function down(): void
    {
        try {
            // Check if users table exists before altering
            if (Schema::hasTable('users')) {
                Schema::table('users', function (Blueprint $table) {
                    // Only drop columns if they exist
                    $columnsToDrop = [];
                    if (Schema::hasColumn('users', 'level')) {
                        $columnsToDrop[] = 'level';
                    }
                    if (Schema::hasColumn('users', 'prestige_points')) {
                        $columnsToDrop[] = 'prestige_points';
                    }
                    if (Schema::hasColumn('users', 'last_active')) {
                        $columnsToDrop[] = 'last_active';
                    }
                    
                    if (!empty($columnsToDrop)) {
                        $table->dropColumn($columnsToDrop);
                    }
                });
            }
        } catch (\Exception $e) {
            // If table doesn't exist, skip rollback
        }
    }
};

