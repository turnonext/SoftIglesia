<?php

namespace App\Http\Middleware;

use App\Support\PlatformAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $effectiveRole = PlatformAccess::effectiveRole(
            $user,
            PlatformAccess::actingTenantSlug($request)
        );

        if (! in_array($effectiveRole, $roles, true) && ! in_array($user->role, $roles, true)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return $next($request);
    }
}
