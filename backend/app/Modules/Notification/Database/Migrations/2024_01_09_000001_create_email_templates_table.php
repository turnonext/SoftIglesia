<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_templates')) {
            return;
        }

        Schema::create('email_templates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->string('key', 64);
            $table->string('name');
            $table->string('subject');
            $table->longText('body_html');
            $table->json('available_variables');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'key']);
        });

        if (Schema::hasTable('email_queue') && ! Schema::hasColumn('email_queue', 'body_html')) {
            Schema::table('email_queue', function (Blueprint $table) {
                $table->longText('body_html')->nullable()->after('subject');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('email_queue') && Schema::hasColumn('email_queue', 'body_html')) {
            Schema::table('email_queue', function (Blueprint $table) {
                $table->dropColumn('body_html');
            });
        }

        Schema::dropIfExists('email_templates');
    }
};
