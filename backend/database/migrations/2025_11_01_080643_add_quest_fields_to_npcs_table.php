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
        Schema::table('npcs', function (Blueprint $table) {
            $table->boolean('can_give_quests')->default(true)->after('required_company_level');
            $table->json('quest_types')->nullable()->after('can_give_quests'); // e.g., ["hire_employee", "complete_project", "launch_product"]
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('npcs', function (Blueprint $table) {
            $table->dropColumn(['can_give_quests', 'quest_types']);
        });
    }
};
