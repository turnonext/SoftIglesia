<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_gatherings')) {
            Schema::create('church_gatherings', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->ulid('campus_id')->nullable();
                $table->ulid('church_group_id')->nullable();
                $table->string('title', 200);
                $table->text('description')->nullable();
                $table->string('type', 32)->default('service');
                $table->string('status', 32)->default('scheduled');
                $table->timestamp('starts_at');
                $table->timestamp('ends_at')->nullable();
                $table->string('location', 255)->nullable();
                $table->boolean('checkin_enabled')->default(true);
                $table->string('checkin_token', 64)->nullable()->unique('cg_checkin_token_uq');
                $table->unsignedInteger('attendance_count')->default(0);
                $table->unsignedSmallInteger('volunteers_needed')->default(0);
                $table->boolean('children_ministry_enabled')->default(false);
                $table->text('notes')->nullable();
                $table->json('metrics')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('tenant_id', 'cg_tenant_idx');
                $table->index('campus_id', 'cg_campus_idx');
                $table->index('church_group_id', 'cg_group_idx');
                $table->index(['tenant_id', 'starts_at'], 'cg_tenant_starts_idx');
                $table->index(['tenant_id', 'status', 'type'], 'cg_tenant_status_type_idx');
            });
        }

        if (! Schema::hasTable('church_gathering_attendances')) {
            Schema::create('church_gathering_attendances', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->foreignUlid('church_gathering_id')
                    ->constrained('church_gatherings')
                    ->cascadeOnDelete();
                $table->ulid('member_id')->nullable();
                $table->string('guest_name', 160)->nullable();
                $table->string('method', 32)->default('manual');
                $table->timestamp('checked_in_at')->useCurrent();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index('tenant_id', 'cga_tenant_idx');
                $table->index('member_id', 'cga_member_idx');
                $table->index(['tenant_id', 'church_gathering_id', 'checked_in_at'], 'cga_tenant_gath_chk_idx');
                $table->unique(['church_gathering_id', 'member_id'], 'cga_gath_member_uq');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('church_gathering_attendances');
        Schema::dropIfExists('church_gatherings');
    }
};
