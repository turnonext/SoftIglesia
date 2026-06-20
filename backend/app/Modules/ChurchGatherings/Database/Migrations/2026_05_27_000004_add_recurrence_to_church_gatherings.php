<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('church_gatherings', function (Blueprint $table) {
            if (! Schema::hasColumn('church_gatherings', 'recurrence_series_id')) {
                $table->ulid('recurrence_series_id')->nullable()->after('metrics');
                $table->unsignedTinyInteger('recurrence_weekday')->nullable()->after('recurrence_series_id');
                $table->index('recurrence_series_id', 'cg_recurrence_series_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('church_gatherings', function (Blueprint $table) {
            if (Schema::hasColumn('church_gatherings', 'recurrence_series_id')) {
                $table->dropIndex('cg_recurrence_series_idx');
                $table->dropColumn(['recurrence_series_id', 'recurrence_weekday']);
            }
        });
    }
};
