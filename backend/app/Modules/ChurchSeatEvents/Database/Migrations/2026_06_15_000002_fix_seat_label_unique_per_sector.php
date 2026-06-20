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

        Schema::table('church_seat_event_seats', function (Blueprint $table) {
            $table->dropUnique('cses_event_label_uq');
            $table->unique(
                ['church_seat_event_sector_id', 'label'],
                'cses_sector_label_uq'
            );
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('church_seat_event_seats')) {
            return;
        }

        Schema::table('church_seat_event_seats', function (Blueprint $table) {
            $table->dropUnique('cses_sector_label_uq');
            $table->unique(['church_seat_event_id', 'label'], 'cses_event_label_uq');
        });
    }
};
