<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('market_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_type'); // boom, crash, trend, bug, hype
            $table->text('description');
            $table->json('effect'); // {revenue_multiplier: 1.5, duration: 300}
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_events');
    }
};

