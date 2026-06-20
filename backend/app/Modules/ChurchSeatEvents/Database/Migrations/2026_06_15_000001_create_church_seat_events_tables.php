<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_seat_events')) {
            Schema::create('church_seat_events', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->ulid('church_space_id')->nullable();
                $table->string('name', 200);
                $table->text('description')->nullable();
                $table->dateTime('starts_at');
                $table->dateTime('ends_at')->nullable();
                $table->string('status', 32)->default('active');
                $table->boolean('reservations_paused')->default(false);
                $table->string('reservation_token', 64);
                $table->unsignedInteger('token_version')->default(1);
                $table->unsignedSmallInteger('hold_minutes')->default(3);
                $table->unsignedSmallInteger('max_reservations_per_user')->default(1);
                $table->timestamps();
                $table->softDeletes();

                $table->index('tenant_id', 'cse_tenant_idx');
                $table->index(['tenant_id', 'status'], 'cse_tenant_status_idx');
                $table->index(['tenant_id', 'starts_at'], 'cse_tenant_start_idx');
                $table->unique(['tenant_id', 'reservation_token'], 'cse_tenant_token_uq');
                $table->foreign('church_space_id')->references('id')->on('church_spaces')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('church_seat_event_sectors')) {
            Schema::create('church_seat_event_sectors', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->ulid('church_seat_event_id');
                $table->string('name', 80);
                $table->unsignedSmallInteger('row_count');
                $table->unsignedSmallInteger('seats_per_row');
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index('church_seat_event_id', 'cses_event_idx');
                $table->foreign('church_seat_event_id')->references('id')->on('church_seat_events')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('church_seat_event_seats')) {
            Schema::create('church_seat_event_seats', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->ulid('church_seat_event_id');
                $table->ulid('church_seat_event_sector_id');
                $table->string('row_label', 8);
                $table->unsignedSmallInteger('seat_number');
                $table->string('label', 24);
                $table->string('status', 32)->default('available');
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['church_seat_event_id', 'status'], 'cses_event_status_idx');
                $table->unique(['church_seat_event_sector_id', 'label'], 'cses_sector_label_uq');
                $table->foreign('church_seat_event_id')->references('id')->on('church_seat_events')->cascadeOnDelete();
                $table->foreign('church_seat_event_sector_id')->references('id')->on('church_seat_event_sectors')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('church_seat_event_reservations')) {
            Schema::create('church_seat_event_reservations', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->ulid('tenant_id');
                $table->ulid('church_seat_event_id');
                $table->ulid('church_seat_event_seat_id');
                $table->string('session_token', 64);
                $table->string('attendee_name', 160)->nullable();
                $table->string('attendee_email', 200)->nullable();
                $table->string('attendee_phone', 40)->nullable();
                $table->string('status', 32)->default('held');
                $table->dateTime('held_until')->nullable();
                $table->dateTime('confirmed_at')->nullable();
                $table->string('confirmation_code', 16)->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['church_seat_event_id', 'status'], 'cser_event_status_idx');
                $table->index(['church_seat_event_seat_id', 'status'], 'cser_seat_status_idx');
                $table->index(['session_token', 'status'], 'cser_session_status_idx');
                $table->index('held_until', 'cser_held_until_idx');
                $table->foreign('church_seat_event_id')->references('id')->on('church_seat_events')->cascadeOnDelete();
                $table->foreign('church_seat_event_seat_id')->references('id')->on('church_seat_event_seats')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('church_seat_event_reservations');
        Schema::dropIfExists('church_seat_event_seats');
        Schema::dropIfExists('church_seat_event_sectors');
        Schema::dropIfExists('church_seat_events');
    }
};
