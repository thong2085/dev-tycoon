<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_items', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'boost_2x', 'auto_clicker'
            $table->string('name');
            $table->text('description');
            $table->string('icon')->default('🛒');
            $table->string('category'); // booster, cosmetic, special
            $table->decimal('price', 12, 2);
            $table->integer('duration_minutes')->nullable(); // null = permanent
            $table->string('effect_type'); // multiplier, instant, permanent
            $table->json('effect_data'); // e.g., {"type": "income", "multiplier": 2}
            $table->boolean('is_available')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('shop_item_id')->constrained()->onDelete('cascade');
            $table->timestamp('purchased_at');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_purchases');
        Schema::dropIfExists('shop_items');
    }
};

