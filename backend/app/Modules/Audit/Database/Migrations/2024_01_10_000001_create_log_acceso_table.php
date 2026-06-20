<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('log_acceso', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->nullable()->index();
            $table->foreignUlid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email')->nullable();
            $table->string('action', 64)->index();
            $table->string('method', 12)->nullable();
            $table->string('path', 512)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->boolean('success')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'user_id', 'created_at']);
            $table->index(['tenant_id', 'action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_acceso');
    }
};
