<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->integer('experience')->default(0)->after('skill_level');
            $table->integer('morale')->default(80)->after('energy'); // 0-100
            $table->integer('level')->default(1)->after('skill_level');
            $table->foreignId('assigned_project_id')->nullable()->after('company_id')->constrained('projects')->onDelete('set null');
            $table->integer('projects_completed')->default(0)->after('status');
            $table->timestamp('last_worked')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['assigned_project_id']);
            $table->dropColumn(['experience', 'morale', 'level', 'assigned_project_id', 'projects_completed', 'last_worked']);
        });
    }
};

