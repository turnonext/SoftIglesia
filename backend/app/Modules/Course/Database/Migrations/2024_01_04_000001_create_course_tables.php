<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->string('name');
            $table->string('code', 32)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'code']);
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->foreignUlid('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->ulid('instructor_user_id')->index();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('draft');
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'published_at']);
        });

        Schema::create('course_modules', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['course_id', 'sort_order']);
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->foreignUlid('course_id')->constrained('courses')->cascadeOnDelete();
            $table->ulid('student_user_id')->index();
            $table->string('status', 20)->default('active');
            $table->timestamp('enrolled_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['course_id', 'student_user_id']);
            $table->index(['tenant_id', 'student_user_id', 'status']);
        });

        Schema::create('course_assignments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('course_id')->constrained('courses')->cascadeOnDelete();
            $table->ulid('assignee_user_id')->index();
            $table->string('role', 32)->default('assistant');
            $table->timestamps();
            $table->unique(['course_id', 'assignee_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_assignments');
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('subjects');
    }
};
