<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('user_id')->index();
            $table->string('channel', 32);
            $table->string('type', 64);
            $table->json('payload');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });

        Schema::create('email_queue', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->nullable()->index();
            $table->string('to_email');
            $table->string('subject');
            $table->string('template', 64)->nullable();
            $table->json('variables')->nullable();
            $table->string('status', 20)->default('pending');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->text('last_error')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->timestamps();

            $table->index(['status', 'scheduled_at']);
        });

        Schema::create('notification_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('notification_id')->nullable()->index();
            $table->string('event', 64);
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
        Schema::dropIfExists('email_queue');
        Schema::dropIfExists('notifications');
    }
};
