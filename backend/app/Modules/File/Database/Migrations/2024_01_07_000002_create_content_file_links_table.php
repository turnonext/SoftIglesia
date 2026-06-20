<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_file_links', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->foreignUlid('file_id')->constrained('files')->cascadeOnDelete();
            $table->ulid('course_id')->nullable()->index();
            $table->ulid('course_subject_id')->nullable()->index();
            $table->ulid('class_id')->nullable()->index();
            $table->string('label')->nullable();
            $table->timestamps();

            $table->index(['course_id', 'course_subject_id', 'class_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_file_links');
    }
};
