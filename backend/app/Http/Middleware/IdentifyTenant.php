<?php

namespace App\Http\Middleware;

use App\Modules\Shared\Models\Tenant;
use App\Support\PlatformAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        // Tras auth:api el tenant siempre es el del JWT (evita scope incorrecto por header).
        if ($user = $request->user()) {
            $actAs = PlatformAccess::actingTenantSlug($request);
            $tenantId = PlatformAccess::resolveTenantId($user, $actAs);
            app()->instance('current.tenant_id', $tenantId);
            if ($actAs) {
                app()->instance('current.act_as_tenant_slug', $actAs);
            }
        } else {
            $slug = $request->header('X-Tenant-Slug')
                ?? $request->input('tenant_slug');

            if ($slug) {
                $tenant = Tenant::query()->where('slug', $slug)->where('is_active', true)->first();
                if ($tenant) {
                    app()->instance('current.tenant_id', $tenant->id);
                }
            }
        }

        return $next($request);
    }
}
