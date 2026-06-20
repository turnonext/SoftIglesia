<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_seat_events')) {
            return;
        }

        Schema::table('church_seat_events', function (Blueprint $table) {
            if (! Schema::hasColumn('church_seat_events', 'max_reservations_per_user')) {
                $table->unsignedSmallInteger('max_reservations_per_user')->default(1)->after('hold_minutes');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('church_seat_events')) {
            return;
        }

        Schema::table('church_seat_events', function (Blueprint $table) {
            if (Schema::hasColumn('church_seat_events', 'max_reservations_per_user')) {
                $table->dropColumn('max_reservations_per_user');
            }
        });
    }
};
