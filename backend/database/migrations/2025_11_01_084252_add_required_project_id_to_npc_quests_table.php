<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('npc_quests', function (Blueprint $table) {
            $table->foreignId('required_project_id')->nullable()->after('npc_id')->constrained('projects')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('npc_quests', function (Blueprint $table) {
            $table->dropForeign(['required_project_id']);
            $table->dropColumn('required_project_id');
        });
    }
};
