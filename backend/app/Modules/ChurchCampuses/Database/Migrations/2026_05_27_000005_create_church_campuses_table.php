<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_campuses')) {
            Schema::create('church_campuses', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->string('name', 160);
                $table->string('code', 32)->nullable();
                $table->string('address_line')->nullable();
                $table->string('city', 120)->nullable();
                $table->string('state', 120)->nullable();
                $table->string('country', 120)->nullable();
                $table->string('phone', 40)->nullable();
                $table->string('email', 180)->nullable();
                $table->string('leader_name', 160)->nullable();
                $table->string('status', 32)->default('active');
                $table->boolean('is_headquarters')->default(false);
                $table->unsignedInteger('member_count')->default(0);
                $table->unsignedInteger('group_count')->default(0);
                $table->text('notes')->nullable();
                $table->json('metrics')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('tenant_id', 'ccampus_tenant_idx');
                $table->index(['tenant_id', 'status'], 'ccampus_tenant_status_idx');
                $table->unique(['tenant_id', 'code'], 'ccampus_tenant_code_uq');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('church_campuses');
    }
};
