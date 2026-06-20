<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('professions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name', 120);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique('name');
        });

        Schema::table('members', function (Blueprint $table) {
            $table->foreignUlid('profession_id')
                ->nullable()
                ->after('spiritual_status')
                ->constrained('professions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropConstrainedForeignId('profession_id');
        });

        Schema::dropIfExists('professions');
    }
};
