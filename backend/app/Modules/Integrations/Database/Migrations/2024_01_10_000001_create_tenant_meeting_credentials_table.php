<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_meeting_credentials', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->string('provider', 16);
            $table->text('credentials');
            $table->boolean('is_enabled')->default(true);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_meeting_credentials');
    }
};
