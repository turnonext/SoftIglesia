<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nationalities', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name', 120);
            $table->string('code', 8)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique('name');
        });

        Schema::table('members', function (Blueprint $table) {
            $table->foreignUlid('nationality_id')
                ->nullable()
                ->after('profession_id')
                ->constrained('nationalities')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropConstrainedForeignId('nationality_id');
        });

        Schema::dropIfExists('nationalities');
    }
};
