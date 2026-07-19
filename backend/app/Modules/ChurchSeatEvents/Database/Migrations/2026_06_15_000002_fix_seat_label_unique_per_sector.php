<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_seat_event_seats')) {
            return;
        }

        $indexNames = collect(Schema::getIndexes('church_seat_event_seats'))
            ->pluck('name')
            ->all();

        // Fresh installs already have cses_sector_label_uq from the create migration.
        if (! in_array('cses_event_label_uq', $indexNames, true)
            && in_array('cses_sector_label_uq', $indexNames, true)) {
            return;
        }

        Schema::table('church_seat_event_seats', function (Blueprint $table) use ($indexNames) {
            if (in_array('cses_event_label_uq', $indexNames, true)) {
                $table->dropUnique('cses_event_label_uq');
            }

            if (! in_array('cses_sector_label_uq', $indexNames, true)) {
                $table->unique(
                    ['church_seat_event_sector_id', 'label'],
                    'cses_sector_label_uq'
                );
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('church_seat_event_seats')) {
            return;
        }

        $indexNames = collect(Schema::getIndexes('church_seat_event_seats'))
            ->pluck('name')
            ->all();

        Schema::table('church_seat_event_seats', function (Blueprint $table) use ($indexNames) {
            if (in_array('cses_sector_label_uq', $indexNames, true)) {
                $table->dropUnique('cses_sector_label_uq');
            }

            if (! in_array('cses_event_label_uq', $indexNames, true)) {
                $table->unique(['church_seat_event_id', 'label'], 'cses_event_label_uq');
            }
        });
    }
};
