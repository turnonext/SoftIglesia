<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('class_id')->index();
            $table->ulid('student_user_id')->index();
            $table->string('status', 20)->default('present');
            $table->timestamp('marked_at');
            $table->ulid('marked_by_user_id')->nullable();
            $table->string('source', 32)->default('manual');
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->timestamps();

            $table->unique(['class_id', 'student_user_id', 'marked_at']);
            $table->index(['tenant_id', 'student_user_id']);
        });

        Schema::create('student_progress', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('course_id')->index();
            $table->ulid('student_user_id')->index();
            $table->decimal('completion_percent', 5, 2)->default(0);
            $table->unsignedInteger('lessons_completed')->default(0);
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->unique(['course_id', 'student_user_id']);
        });

        Schema::create('attendance_summaries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('course_id')->index();
            $table->ulid('student_user_id')->index();
            $table->unsignedInteger('present_count')->default(0);
            $table->unsignedInteger('absent_count')->default(0);
            $table->unsignedInteger('late_count')->default(0);
            $table->date('period_start');
            $table->date('period_end');
            $table->timestamps();

            $table->index(['tenant_id', 'course_id', 'period_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_summaries');
        Schema::dropIfExists('student_progress');
        Schema::dropIfExists('attendance_records');
    }
};
