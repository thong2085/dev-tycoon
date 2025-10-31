<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modify ENUM to add 'available' status
        DB::statement("ALTER TABLE projects MODIFY COLUMN status ENUM('available', 'queued', 'in_progress', 'completed', 'failed') DEFAULT 'queued'");
    }

    public function down(): void
    {
        // Revert to original ENUM values
        DB::statement("ALTER TABLE projects MODIFY COLUMN status ENUM('queued', 'in_progress', 'completed', 'failed') DEFAULT 'queued'");
    }
};
