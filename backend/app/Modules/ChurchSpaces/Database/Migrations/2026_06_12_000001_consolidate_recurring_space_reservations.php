<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_space_reservations')) {
            return;
        }

        if (! Schema::hasColumn('church_space_reservations', 'recurrence_series_id')) {
            return;
        }

        $seriesIds = DB::table('church_space_reservations')
            ->whereNotNull('recurrence_series_id')
            ->distinct()
            ->pluck('recurrence_series_id');

        foreach ($seriesIds as $seriesId) {
            $rows = DB::table('church_space_reservations')
                ->where('recurrence_series_id', $seriesId)
                ->orderBy('starts_at')
                ->get();

            if ($rows->isEmpty()) {
                continue;
            }

            $keep = $rows->first();
            DB::table('church_space_reservations')
                ->where('id', $keep->id)
                ->update(['recurrence_series_id' => $keep->id]);

            $deleteIds = $rows->skip(1)->pluck('id')->all();
            if ($deleteIds !== []) {
                DB::table('church_space_reservations')->whereIn('id', $deleteIds)->delete();
            }
        }
    }

    public function down(): void
    {
        // No se puede reconstruir las filas eliminadas.
    }
};
