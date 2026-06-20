<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('church_spaces') && ! Schema::hasColumn('church_spaces', 'layout_x')) {
            Schema::table('church_spaces', function (Blueprint $table) {
                $table->unsignedSmallInteger('layout_x')->nullable()->after('floor');
                $table->unsignedSmallInteger('layout_y')->nullable()->after('layout_x');
                $table->unsignedSmallInteger('layout_w')->nullable()->default(2)->after('layout_y');
                $table->unsignedSmallInteger('layout_h')->nullable()->default(2)->after('layout_w');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('church_spaces')) {
            Schema::table('church_spaces', function (Blueprint $table) {
                $table->dropColumn(['layout_x', 'layout_y', 'layout_w', 'layout_h']);
            });
        }
    }
};
