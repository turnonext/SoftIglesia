<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_ministries')) {
            Schema::create('church_ministries', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->ulid('campus_id')->nullable();
                $table->string('name', 160);
                $table->text('description')->nullable();
                $table->string('type', 32)->default('general');
                $table->string('leader_name', 160)->nullable();
                $table->string('leader_email', 180)->nullable();
                $table->string('leader_phone', 40)->nullable();
                $table->string('status', 32)->default('active');
                $table->unsignedInteger('member_count')->default(0);
                $table->unsignedInteger('volunteer_count')->default(0);
                $table->text('notes')->nullable();
                $table->json('metrics')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('tenant_id', 'cmin_tenant_idx');
                $table->index(['tenant_id', 'status'], 'cmin_tenant_status_idx');
                $table->index(['tenant_id', 'type'], 'cmin_tenant_type_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('church_ministries');
    }
};
