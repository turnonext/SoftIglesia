<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->date('start_date')->nullable()->after('capacity');
            $table->date('end_date')->nullable()->after('start_date');
            $table->unsignedTinyInteger('duration_months')->nullable()->after('end_date');
            $table->json('schedule_days')->nullable()->after('duration_months');
            $table->time('class_start_time')->nullable()->after('schedule_days');
            $table->time('class_end_time')->nullable()->after('class_start_time');
            $table->unsignedSmallInteger('minutes_per_class')->default(90)->after('class_end_time');
            $table->unsignedTinyInteger('subjects_count')->default(1)->after('minutes_per_class');
            $table->unsignedSmallInteger('classes_per_subject')->nullable()->after('subjects_count');
            $table->unsignedSmallInteger('total_classes_planned')->default(0)->after('classes_per_subject');
            $table->string('generation_mode', 16)->default('auto')->after('total_classes_planned');
        });

        Schema::create('course_subjects', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->foreignUlid('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->unsignedSmallInteger('classes_count')->default(0);
            $table->unsignedSmallInteger('minutes_per_class')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['course_id', 'sort_order']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->foreignUlid('course_subject_id')
                ->nullable()
                ->after('course_id')
                ->constrained('course_subjects')
                ->nullOnDelete();
            $table->unsignedSmallInteger('session_number')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_subject_id');
            $table->dropColumn('session_number');
        });
        Schema::dropIfExists('course_subjects');
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'start_date', 'end_date', 'duration_months', 'schedule_days',
                'class_start_time', 'class_end_time', 'minutes_per_class',
                'subjects_count', 'classes_per_subject', 'total_classes_planned', 'generation_mode',
            ]);
        });
    }
};
