<?php

namespace App\Modules\ChurchPeople\Http\Controllers;

use App\Modules\ChurchPeople\Http\Requests\UpdateMemberRegistrationSettingsRequest;
use App\Modules\ChurchPeople\Services\MemberRegistrationService;
use App\Modules\Shared\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MemberRegistrationSettingsController extends Controller
{
    public function __construct(
        private readonly MemberRegistrationService $registration,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);
        $token = $this->registration->ensureToken($tenant);

        return response()->json([
            'data' => $this->presentSettings($tenant, $token),
        ]);
    }

    public function update(UpdateMemberRegistrationSettingsRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request);
        $updated = $this->registration->updateSettings($tenant, $request->validated());
        $token = $this->registration->ensureToken($updated);
        $settings = $this->registration->settings($updated);

        return response()->json([
            'data' => $this->presentSettings($updated, $token),
            'message' => 'Configuración de registro actualizada.',
        ]);
    }

    public function regenerate(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $tenant = $this->resolveTenant($request);
        $token = $this->registration->regenerateToken($tenant);

        return response()->json([
            'data' => $this->presentSettings($tenant, $token),
            'message' => 'Se generó un nuevo enlace de registro.',
        ]);
    }

    /** @return array<string, mixed> */
    private function presentSettings(Tenant $tenant, string $token): array
    {
        $settings = $this->registration->settings($tenant);

        return [
            'enabled' => $settings['enabled'],
            'fields' => $settings['fields'],
            'required_fields' => $settings['required_fields'],
            'optional_fields' => $settings['optional_fields'],
            'register_url' => $this->registration->registerUrl($tenant, $token),
            'token' => $token,
        ];
    }

    private function resolveTenant(Request $request): Tenant
    {
        $tenantId = app()->bound('current.tenant_id')
            ? app('current.tenant_id')
            : $request->user()?->tenant_id;

        return Tenant::query()->findOrFail($tenantId);
    }
}
