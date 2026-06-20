<?php

namespace App\Http\Middleware;

use App\Modules\ChurchPeople\Services\MemberRegistrationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MemberRegistrationContext
{
    public function __construct(
        private readonly MemberRegistrationService $registration,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->header('X-Tenant-Slug')
            ?? $request->input('tenant_slug')
            ?? $request->query('tenant');

        $token = (string) (
            $request->input('token')
            ?? $request->query('token')
            ?? ''
        );

        $tenant = $this->registration->resolveTenant(is_string($slug) ? $slug : null);

        abort_unless($tenant && $this->registration->validateAccess($tenant, $token), 403, 'El enlace de registro no es válido o está deshabilitado.');

        app()->instance('current.tenant_id', $tenant->id);
        app()->instance('current.tenant', $tenant);

        return $next($request);
    }
}
