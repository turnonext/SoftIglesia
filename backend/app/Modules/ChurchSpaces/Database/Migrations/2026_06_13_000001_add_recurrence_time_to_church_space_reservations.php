<?php

use App\Modules\ChurchSpaces\Models\ChurchSpaceReservation;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('church_space_reservations', function (Blueprint $table) {
            $table->string('recurrence_time', 5)->nullable()->after('recurrence_interval_weeks');
        });

        ChurchSpaceReservation::query()
            ->whereNotNull('recurrence_weekday')
            ->whereNull('recurrence_time')
            ->orderBy('id')
            ->each(function (ChurchSpaceReservation $reservation) {
                // Datos anteriores: la hora local quedó guardada como UTC literal (ej. 19:00).
                $reservation->recurrence_time = $reservation->starts_at->format('H:i');
                $reservation->saveQuietly();
            });
    }

    public function down(): void
    {
        Schema::table('church_space_reservations', function (Blueprint $table) {
            $table->dropColumn('recurrence_time');
        });
    }
};
