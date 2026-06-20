<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('duration_unit', 16)->default('months')->after('duration_months');
            $table->unsignedTinyInteger('duration_weeks')->nullable()->after('duration_unit');
            $table->string('class_distribution', 32)->default('interleaved')->after('generation_mode');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['duration_unit', 'duration_weeks', 'class_distribution']);
        });
    }
};
