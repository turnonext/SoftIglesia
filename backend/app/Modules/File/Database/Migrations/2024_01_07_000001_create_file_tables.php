<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('uploaded_by_user_id')->index();
            $table->string('disk', 32)->default('s3');
            $table->string('bucket')->nullable();
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 128);
            $table->unsignedBigInteger('size_bytes');
            $table->string('checksum', 64)->nullable();
            $table->string('visibility', 16)->default('private');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'mime_type']);
        });

        Schema::create('upload_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->string('status', 20);
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('file_permissions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('file_id')->constrained('files')->cascadeOnDelete();
            $table->string('grantee_type', 32);
            $table->ulid('grantee_id');
            $table->string('permission', 32)->default('read');
            $table->timestamps();

            $table->unique(['file_id', 'grantee_type', 'grantee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_permissions');
        Schema::dropIfExists('upload_logs');
        Schema::dropIfExists('files');
    }
};
