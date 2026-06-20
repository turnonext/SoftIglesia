<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->string('email');
            $table->string('password');
            $table->string('role', 32)->default('student');
            $table->boolean('is_active')->default(true);
            $table->boolean('mfa_enabled')->default(false);
            $table->string('mfa_secret')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'email']);
            $table->index(['tenant_id', 'role', 'is_active']);
        });

        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->string('family_id', 36)->index();
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'expires_at']);
        });

        Schema::create('email_verifications', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('password_resets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs_auth', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->nullable()->index();
            $table->foreignUlid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 64);
            $table->string('ip_address', 45)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'action', 'created_at']);
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUlid('user_id')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->ulid('tenant_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('audit_logs_auth');
        Schema::dropIfExists('password_resets');
        Schema::dropIfExists('email_verifications');
        Schema::dropIfExists('refresh_tokens');
        Schema::dropIfExists('users');
    }
};
