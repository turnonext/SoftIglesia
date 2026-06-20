<?php

namespace App\Modules\Integrations\Http\Controllers;

use App\Modules\Integrations\Http\Requests\UpdateMeetCredentialsRequest;
use App\Modules\Integrations\Http\Requests\UpdateZoomCredentialsRequest;
use App\Modules\Integrations\Services\GoogleMeetMeetingProvider;
use App\Modules\Integrations\Services\TenantMeetingCredentialService;
use App\Modules\Integrations\Services\ZoomMeetingProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;

class MeetingIntegrationController extends Controller
{
    public function __construct(
        private readonly TenantMeetingCredentialService $credentials,
        private readonly ZoomMeetingProvider $zoom,
        private readonly GoogleMeetMeetingProvider $meet,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        if (! Schema::hasTable('tenant_meeting_credentials')) {
            return response()->json([
                'message' => 'Ejecutá las migraciones: php artisan migrate --force',
            ], 503);
        }

        $tenantId = $request->user()->tenant_id;

        return response()->json([
            'data' => [
                'zoom' => $this->credentials->presentStatus($tenantId, 'zoom'),
                'meet' => $this->credentials->presentStatus($tenantId, 'meet'),
            ],
        ]);
    }

    public function updateZoom(UpdateZoomCredentialsRequest $request): JsonResponse
    {
        if (! Schema::hasTable('tenant_meeting_credentials')) {
            return response()->json(['message' => 'Migraciones pendientes.'], 503);
        }

        $tenantId = $request->user()->tenant_id;
        $validated = $request->validated();

        $payload = [
            'account_id' => $validated['account_id'],
            'client_id' => $validated['client_id'],
        ];
        if (! empty($validated['client_secret'])) {
            $payload['client_secret'] = $validated['client_secret'];
        }

        $this->credentials->upsert(
            $tenantId,
            'zoom',
            $payload,
            $validated['is_enabled'] ?? true
        );

        return response()->json([
            'data' => $this->credentials->presentStatus($tenantId, 'zoom'),
            'message' => 'Credenciales de Zoom guardadas.',
        ]);
    }

    public function updateMeet(UpdateMeetCredentialsRequest $request): JsonResponse
    {
        if (! Schema::hasTable('tenant_meeting_credentials')) {
            return response()->json(['message' => 'Migraciones pendientes.'], 503);
        }

        $tenantId = $request->user()->tenant_id;
        $validated = $request->validated();

        $payload = [
            'client_id' => $validated['client_id'],
            'calendar_id' => $validated['calendar_id'] ?? 'primary',
        ];
        if (! empty($validated['client_secret'])) {
            $payload['client_secret'] = $validated['client_secret'];
        }
        if (! empty($validated['refresh_token'])) {
            $payload['refresh_token'] = $validated['refresh_token'];
        }

        $this->credentials->upsert(
            $tenantId,
            'meet',
            $payload,
            $validated['is_enabled'] ?? true
        );

        return response()->json([
            'data' => $this->credentials->presentStatus($tenantId, 'meet'),
            'message' => 'Credenciales de Google Meet guardadas.',
        ]);
    }

    public function test(Request $request, string $provider): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $tenantId = $request->user()->tenant_id;

        try {
            match ($provider) {
                'zoom' => $this->zoom->testConnection($tenantId),
                'meet' => $this->meet->testConnection($tenantId),
                default => abort(404),
            };
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'ok' => false,
            ], 422);
        }

        return response()->json([
            'ok' => true,
            'message' => 'Conexión verificada correctamente.',
            'data' => $this->credentials->presentStatus($tenantId, $provider),
        ]);
    }
}
