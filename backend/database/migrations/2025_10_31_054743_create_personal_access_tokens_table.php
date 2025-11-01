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
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            // Use shorter varchar for tokenable_type to avoid "key too long" error with utf8mb4
            // Index on (tokenable_type, tokenable_id) with utf8mb4 can exceed 1000 bytes
            // tokenable_type typically needs ~50 chars, so use 100 to be safe
            $table->string('tokenable_type', 100);
            $table->unsignedBigInteger('tokenable_id');
            $table->index(['tokenable_type', 'tokenable_id'], 'tokenable_index');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
