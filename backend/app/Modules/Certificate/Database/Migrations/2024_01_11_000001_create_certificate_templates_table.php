<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('certificate_templates')) {
            return;
        }

        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->string('key', 64);
            $table->string('name');
            $table->longText('body_html');
            $table->json('available_variables');
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_templates');
    }
};
