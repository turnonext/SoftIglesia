<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('certificate_signatures')) {
            return;
        }

        Schema::create('certificate_signatures', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id');
            $table->unsignedTinyInteger('slot');
            $table->boolean('enabled')->default(false);
            $table->string('name', 120)->default('');
            $table->string('title', 120)->default('');
            $table->string('image_path', 512)->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'slot']);
            $table->index('tenant_id');
        });

        $this->migrateFromTemplatesColumn();
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_signatures');
    }

    private function migrateFromTemplatesColumn(): void
    {
        if (! Schema::hasTable('certificate_templates') || ! Schema::hasColumn('certificate_templates', 'signatures')) {
            return;
        }

        $rows = DB::table('certificate_templates')
            ->whereNotNull('signatures')
            ->orderBy('tenant_id')
            ->orderBy('updated_at', 'desc')
            ->get(['tenant_id', 'signatures']);

        $seen = [];
        foreach ($rows as $row) {
            if (isset($seen[$row->tenant_id])) {
                continue;
            }
            $seen[$row->tenant_id] = true;
            $decoded = json_decode($row->signatures, true);
            if (! is_array($decoded)) {
                continue;
            }
            foreach ($decoded as $i => $slot) {
                if ($i >= 3 || ! is_array($slot)) {
                    break;
                }
                $slotNum = $i + 1;
                if (DB::table('certificate_signatures')->where('tenant_id', $row->tenant_id)->where('slot', $slotNum)->exists()) {
                    continue;
                }
                DB::table('certificate_signatures')->insert([
                    'id' => (string) str()->ulid(),
                    'tenant_id' => $row->tenant_id,
                    'slot' => $slotNum,
                    'enabled' => (bool) ($slot['enabled'] ?? false),
                    'name' => mb_substr((string) ($slot['name'] ?? ''), 0, 120),
                    'title' => mb_substr((string) ($slot['title'] ?? ''), 0, 120),
                    'image_path' => $slot['image_path'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
};
