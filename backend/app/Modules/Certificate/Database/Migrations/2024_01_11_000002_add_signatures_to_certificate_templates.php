<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('certificate_templates')) {
            return;
        }

        if (Schema::hasColumn('certificate_templates', 'signatures')) {
            return;
        }

        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->json('signatures')->nullable()->after('available_variables');
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('certificate_templates') && Schema::hasColumn('certificate_templates', 'signatures')) {
            Schema::table('certificate_templates', function (Blueprint $table) {
                $table->dropColumn('signatures');
            });
        }
    }
};
