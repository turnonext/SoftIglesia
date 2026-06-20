<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_seat_event_sectors')) {
            return;
        }

        Schema::table('church_seat_event_sectors', function (Blueprint $table) {
            if (! Schema::hasColumn('church_seat_event_sectors', 'layout_placement')) {
                $table->string('layout_placement', 16)->default('below')->after('sort_order');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('church_seat_event_sectors')) {
            return;
        }

        Schema::table('church_seat_event_sectors', function (Blueprint $table) {
            if (Schema::hasColumn('church_seat_event_sectors', 'layout_placement')) {
                $table->dropColumn('layout_placement');
            }
        });
    }
};
