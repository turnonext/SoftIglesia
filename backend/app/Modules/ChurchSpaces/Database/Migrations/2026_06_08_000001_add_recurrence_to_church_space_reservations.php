<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_space_reservations')) {
            return;
        }

        Schema::table('church_space_reservations', function (Blueprint $table) {
            if (! Schema::hasColumn('church_space_reservations', 'recurrence_series_id')) {
                $table->ulid('recurrence_series_id')->nullable()->after('notes');
                $table->unsignedTinyInteger('recurrence_weekday')->nullable()->after('recurrence_series_id');
                $table->unsignedTinyInteger('recurrence_interval_weeks')->nullable()->after('recurrence_weekday');
                $table->index('recurrence_series_id', 'cres_recurrence_series_idx');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('church_space_reservations')) {
            return;
        }

        Schema::table('church_space_reservations', function (Blueprint $table) {
            if (Schema::hasColumn('church_space_reservations', 'recurrence_series_id')) {
                $table->dropIndex('cres_recurrence_series_idx');
                $table->dropColumn([
                    'recurrence_series_id',
                    'recurrence_weekday',
                    'recurrence_interval_weeks',
                ]);
            }
        });
    }
};
