<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_outbox', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->nullable()->index();
            $table->string('aggregate_type', 64);
            $table->ulid('aggregate_id')->nullable();
            $table->string('event_name', 128);
            $table->unsignedSmallInteger('event_version')->default(1);
            $table->json('payload');
            $table->string('correlation_id', 64)->nullable()->index();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->string('status', 20)->default('pending');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['status', 'created_at']);
            $table->index(['event_name', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_outbox');
    }
};
