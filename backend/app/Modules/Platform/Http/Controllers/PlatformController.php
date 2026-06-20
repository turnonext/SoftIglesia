<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Modules\Platform\Services\PlatformTenantCatalog;
use App\Modules\Shared\Models\Tenant;
use App\Support\PlatformAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PlatformController extends Controller
{
    public function __construct(
        private readonly PlatformTenantCatalog $catalog,
    ) {}

    public function tenants(Request $request): JsonResponse
    {
        $this->ensurePlatform($request);

        $actingSlug = PlatformAccess::actingTenantSlug($request);

        return response()->json([
            'data' => $this->catalog->listForOwner(),
            'acting_tenant_slug' => $actingSlug,
        ]);
    }

    public function context(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensurePlatform($request);

        $actingSlug = PlatformAccess::actingTenantSlug($request);
        $actingTenant = null;

        if ($actingSlug) {
            $row = Tenant::query()->where('slug', $actingSlug)->first();
            if ($row) {
                $actingTenant = [
                    'id' => $row->id,
                    'name' => $row->name,
                    'slug' => $row->slug,
                ];
            }
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'acting_tenant' => $actingTenant,
        ]);
    }

    private function ensurePlatform(Request $request): void
    {
        abort_unless(PlatformAccess::isPlatformUser($request->user()), 403);
    }
}
