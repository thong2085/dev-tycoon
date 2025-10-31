<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_states', function (Blueprint $table) {
            $table->integer('reputation')->default(0)->after('level');
            $table->integer('completed_projects')->default(0)->after('reputation');
        });
    }

    public function down(): void
    {
        Schema::table('game_states', function (Blueprint $table) {
            $table->dropColumn(['reputation', 'completed_projects']);
        });
    }
};

