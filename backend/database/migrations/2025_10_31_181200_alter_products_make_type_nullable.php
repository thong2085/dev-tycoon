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
            if (!Schema::hasColumn('products', 'type')) {
                $table->string('type')->nullable()->default('generic')->after('name');
            } else {
                $table->string('type')->nullable()->default('generic')->change();
            }
        });
    }

    public function down(): void
    {
        // do not drop legacy column; just revert default/nullability if present
        if (!Schema::hasTable('products') || !Schema::hasColumn('products', 'type')) return;
        Schema::table('products', function (Blueprint $table) {
            $table->string('type')->nullable(false)->default(null)->change();
        });
    }
};


