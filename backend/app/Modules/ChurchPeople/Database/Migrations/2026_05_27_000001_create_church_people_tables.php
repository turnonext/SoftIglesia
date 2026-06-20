<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('campus_id')->nullable()->index();
            $table->string('first_name', 120);
            $table->string('last_name', 120)->nullable();
            $table->string('email', 180)->nullable();
            $table->string('phone', 40)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 32)->nullable();
            $table->string('marital_status', 32)->nullable();
            $table->string('status', 32)->default('visitor');
            $table->date('member_since')->nullable();
            $table->date('visitor_since')->nullable();
            $table->date('baptized_at')->nullable();
            $table->string('discipleship_stage', 64)->nullable();
            $table->string('spiritual_status', 64)->nullable();
            $table->string('family_name', 120)->nullable();
            $table->string('address_line')->nullable();
            $table->string('city', 120)->nullable();
            $table->string('state', 120)->nullable();
            $table->string('country', 120)->nullable();
            $table->string('postal_code', 24)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('last_attended_at')->nullable();
            $table->json('metrics')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status', 'last_attended_at']);
            $table->index(['tenant_id', 'first_name', 'last_name']);
            $table->index(['tenant_id', 'email']);
        });

        Schema::create('member_timeline_events', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->foreignUlid('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('type', 64);
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->timestamp('event_at')->useCurrent();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'member_id', 'event_at']);
            $table->index(['tenant_id', 'type', 'event_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_timeline_events');
        Schema::dropIfExists('members');
    }
};
