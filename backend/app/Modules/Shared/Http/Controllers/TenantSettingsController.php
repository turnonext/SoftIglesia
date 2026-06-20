<?php

namespace App\Modules\Shared\Http\Controllers;

use App\Modules\Shared\Http\Requests\UpdateTenantSettingsRequest;
use App\Modules\Shared\Models\Tenant;
use App\Modules\Shared\Services\TenantBrandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class TenantSettingsController extends Controller
{
    public function __construct(
        private readonly TenantBrandingService $branding,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);

        return response()->json(['data' => $this->branding->present($tenant)]);
    }

    public function update(UpdateTenantSettingsRequest $request): JsonResponse
    {
        abort_if(
            $request->user()?->role === 'platform',
            403,
            'El propietario de plataforma no puede editar la organización desde esta vista.'
        );

        $tenant = $this->resolveTenant($request);
        $updated = $this->branding->update($tenant, $request->validated());

        return response()->json([
            'data' => $this->branding->present($updated),
            'message' => 'Configuración de la organización guardada.',
        ]);
    }

    private function resolveTenant(Request $request): Tenant
    {
        abort_unless($request->user(), 401);

        $tenantId = app()->bound('current.tenant_id')
            ? app('current.tenant_id')
            : $request->user()->tenant_id;

        return Tenant::query()->findOrFail($tenantId);
    }
}
