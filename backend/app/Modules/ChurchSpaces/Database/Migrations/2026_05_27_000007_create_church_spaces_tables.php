<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_spaces')) {
            Schema::create('church_spaces', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->ulid('campus_id')->nullable();
                $table->string('name', 160);
                $table->string('code', 32)->nullable();
                $table->string('building', 120)->nullable();
                $table->string('floor', 40)->nullable();
                $table->text('description')->nullable();
                $table->unsignedSmallInteger('capacity')->default(0);
                $table->string('status', 32)->default('available');
                $table->json('amenities')->nullable();
                $table->string('color', 16)->nullable();
                $table->unsignedSmallInteger('min_booking_minutes')->default(30);
                $table->unsignedSmallInteger('max_booking_minutes')->default(480);
                $table->boolean('requires_approval')->default(false);
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('tenant_id', 'csp_tenant_idx');
                $table->index(['tenant_id', 'status'], 'csp_tenant_status_idx');
                $table->unique(['tenant_id', 'code'], 'csp_tenant_code_uq');
                $table->foreign('campus_id')->references('id')->on('church_campuses')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('church_space_reservations')) {
            Schema::create('church_space_reservations', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->ulid('church_space_id');
                $table->ulid('user_id');
                $table->string('title', 200);
                $table->string('purpose', 500)->nullable();
                $table->dateTime('starts_at');
                $table->dateTime('ends_at');
                $table->unsignedSmallInteger('attendees_count')->default(1);
                $table->string('status', 32)->default('confirmed');
                $table->text('notes')->nullable();
                $table->ulid('recurrence_series_id')->nullable();
                $table->unsignedTinyInteger('recurrence_weekday')->nullable();
                $table->unsignedTinyInteger('recurrence_interval_weeks')->nullable();
                $table->timestamp('cancelled_at')->nullable();
                $table->ulid('cancelled_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('tenant_id', 'cres_tenant_idx');
                $table->index(['tenant_id', 'church_space_id', 'starts_at'], 'cres_tenant_space_start_idx');
                $table->index(['tenant_id', 'status'], 'cres_tenant_status_idx');
                $table->index(['church_space_id', 'starts_at', 'ends_at'], 'cres_space_range_idx');
                $table->index('recurrence_series_id', 'cres_recurrence_series_idx');
                $table->foreign('church_space_id')->references('id')->on('church_spaces')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('church_space_reservations');
        Schema::dropIfExists('church_spaces');
    }
};
