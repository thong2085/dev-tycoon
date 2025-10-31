<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products')) return;

        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'source_project_id')) {
                $table->unsignedBigInteger('source_project_id')->nullable()->after('company_id');
                $table->unique('source_project_id');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('products')) return;
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'source_project_id')) {
                $table->dropUnique(['source_project_id']);
                $table->dropColumn('source_project_id');
            }
        });
    }
};


