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
            if (! Schema::hasColumn('church_space_reservations', 'church_ministry_id')) {
                $table->ulid('church_ministry_id')->nullable()->after('user_id');
                $table->index('church_ministry_id', 'cres_ministry_idx');
                $table->foreign('church_ministry_id')
                    ->references('id')
                    ->on('church_ministries')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('church_space_reservations')) {
            return;
        }

        Schema::table('church_space_reservations', function (Blueprint $table) {
            if (Schema::hasColumn('church_space_reservations', 'church_ministry_id')) {
                $table->dropForeign(['church_ministry_id']);
                $table->dropIndex('cres_ministry_idx');
                $table->dropColumn('church_ministry_id');
            }
        });
    }
};
