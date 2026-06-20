<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_rules', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('course_id')->nullable()->index();
            $table->string('rule_type', 64);
            $table->json('definition');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('academic_statuses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('student_user_id')->index();
            $table->ulid('course_id')->index();
            $table->string('status', 32)->default('in_progress');
            $table->decimal('final_grade', 5, 2)->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->ulid('approved_by_user_id')->nullable();
            $table->timestamps();

            $table->unique(['student_user_id', 'course_id']);
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('student_user_id')->index();
            $table->ulid('course_id')->index();
            $table->string('certificate_number')->unique();
            $table->ulid('file_id')->nullable();
            $table->timestamp('issued_at');
            $table->timestamp('revoked_at')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->timestamps();

            $table->index(['tenant_id', 'issued_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('academic_statuses');
        Schema::dropIfExists('academic_rules');
    }
};
