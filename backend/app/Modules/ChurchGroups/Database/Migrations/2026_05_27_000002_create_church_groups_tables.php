<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('church_groups', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('campus_id')->nullable()->index();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('type', 32)->default('cell');
            $table->string('status', 32)->default('active');
            $table->string('leader_name', 160)->nullable();
            $table->string('leader_phone', 40)->nullable();
            $table->string('leader_email', 180)->nullable();
            $table->ulid('leader_member_id')->nullable()->index();
            $table->string('co_leader_name', 160)->nullable();
            $table->ulid('co_leader_member_id')->nullable()->index();
            $table->string('meeting_day', 32)->nullable();
            $table->string('meeting_time', 16)->nullable();
            $table->string('address_line')->nullable();
            $table->string('city', 120)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedInteger('member_count')->default(0);
            $table->string('weekly_topic', 255)->nullable();
            $table->json('metrics')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status', 'type']);
            $table->index(['tenant_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('church_groups');
    }
};
