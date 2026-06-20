<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('course_id')->index();
            $table->ulid('instructor_user_id')->index();
            $table->string('title');
            $table->string('provider', 16)->default('zoom');
            $table->string('status', 20)->default('scheduled');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'course_id', 'starts_at']);
        });

        Schema::create('class_schedules', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('rrule')->nullable();
            $table->json('exceptions')->nullable();
            $table->timestamps();
        });

        Schema::create('zoom_meet_links', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('meeting_id')->nullable();
            $table->string('join_url');
            $table->string('start_url')->nullable();
            $table->string('password')->nullable();
            $table->json('provider_meta')->nullable();
            $table->timestamps();
        });

        Schema::create('class_materials', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->ulid('file_id')->nullable()->index();
            $table->string('title');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('class_status_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20);
            $table->ulid('changed_by_user_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_status_logs');
        Schema::dropIfExists('class_materials');
        Schema::dropIfExists('zoom_meet_links');
        Schema::dropIfExists('class_schedules');
        Schema::dropIfExists('classes');
    }
};
