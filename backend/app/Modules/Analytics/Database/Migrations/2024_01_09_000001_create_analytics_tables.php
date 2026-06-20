<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics_daily', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->date('date');
            $table->unsignedInteger('active_users')->default(0);
            $table->unsignedInteger('new_enrollments')->default(0);
            $table->unsignedInteger('classes_held')->default(0);
            $table->json('extra')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'date']);
        });

        Schema::create('metrics_courses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('course_id')->index();
            $table->date('date');
            $table->unsignedInteger('enrollments')->default(0);
            $table->unsignedInteger('completions')->default(0);
            $table->decimal('avg_progress', 5, 2)->default(0);
            $table->timestamps();

            $table->unique(['course_id', 'date']);
        });

        Schema::create('metrics_users', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('user_id')->index();
            $table->date('date');
            $table->unsignedInteger('sessions')->default(0);
            $table->unsignedInteger('lessons_viewed')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics_users');
        Schema::dropIfExists('metrics_courses');
        Schema::dropIfExists('metrics_daily');
    }
};
