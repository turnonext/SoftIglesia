<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('user_id')->index();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone', 32)->nullable();
            $table->text('bio')->nullable();
            $table->string('locale', 8)->default('es');
            $table->string('timezone', 64)->default('UTC');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'user_id']);
        });

        Schema::create('avatars', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('user_id')->index();
            $table->string('disk', 32)->default('s3');
            $table->string('path');
            $table->string('mime_type', 64)->nullable();
            $table->unsignedInteger('size_bytes')->nullable();
            $table->timestamps();
        });

        Schema::create('user_settings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('user_id')->unique();
            $table->json('preferences');
            $table->boolean('email_notifications')->default(true);
            $table->boolean('push_notifications')->default(true);
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('user_id')->index();
            $table->string('action', 64);
            $table->string('entity_type', 64)->nullable();
            $table->ulid('entity_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('user_settings');
        Schema::dropIfExists('avatars');
        Schema::dropIfExists('user_profiles');
    }
};
