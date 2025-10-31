<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_states', function (Blueprint $table) {
            $table->integer('prestige_level')->default(0)->after('completed_projects');
            $table->integer('prestige_points')->default(0)->after('prestige_level');
            $table->decimal('lifetime_earnings', 20, 2)->default(0)->after('prestige_points');
            $table->integer('total_clicks')->default(0)->after('lifetime_earnings');
        });
    }

    public function down(): void
    {
        Schema::table('game_states', function (Blueprint $table) {
            $table->dropColumn(['prestige_level', 'prestige_points', 'lifetime_earnings', 'total_clicks']);
        });
    }
};

