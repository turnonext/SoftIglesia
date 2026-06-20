<?php

namespace App\Modules\Audit\Services;

use App\Modules\Audit\Models\AccessLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AccessLogService
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function record(
        string $action,
        Request $request,
        bool $success = true,
        ?string $tenantId = null,
        ?string $userId = null,
        ?string $email = null,
        ?int $statusCode = null,
        array $metadata = [],
    ): void {
        if (! Schema::hasTable('log_acceso')) {
            return;
        }

        $tenantId ??= app()->bound('current.tenant_id')
            ? (string) app('current.tenant_id')
            : null;

        if (! $tenantId && $request->user()) {
            $tenantId = $request->user()->tenant_id;
        }

        AccessLog::query()->create([
            'tenant_id' => $tenantId,
            'user_id' => $userId ?? $request->user()?->id,
            'email' => $email ?? $request->user()?->email,
            'action' => $action,
            'method' => $request->method(),
            'path' => Str::limit($request->path(), 512, ''),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 2000, ''),
            'status_code' => $statusCode,
            'success' => $success,
            'metadata' => $metadata ?: null,
            'created_at' => now(),
        ]);
    }

    /**
     * Eventos de negocio (crear curso, asignar profesor, actualizar campos, etc.).
     *
     * @param  array<string, mixed>  $metadata
     */
    public function recordDomain(
        string $action,
        Request $request,
        array $metadata = [],
        bool $success = true,
        ?int $statusCode = null,
        ?string $tenantId = null,
    ): void {
        $this->record(
            action: $action,
            request: $request,
            success: $success,
            tenantId: $tenantId,
            statusCode: $statusCode ?? 200,
            metadata: $metadata,
        );
    }

}
