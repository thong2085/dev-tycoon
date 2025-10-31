<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leaderboards', function (Blueprint $table) {
            $table->decimal('money', 15, 2)->default(0)->after('score');
            $table->integer('level')->default(0)->after('money');
            $table->integer('reputation')->default(0)->after('level');
            $table->integer('projects_completed')->default(0)->after('reputation');
        });
    }

    public function down(): void
    {
        Schema::table('leaderboards', function (Blueprint $table) {
            $table->dropColumn(['money', 'level', 'reputation', 'projects_completed']);
        });
    }
};

