<?php

namespace App\Http\Middleware;

use App\Modules\ChurchSeatEvents\Services\PublicSeatEventService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SeatEventReservationContext
{
    public function __construct(
        private readonly PublicSeatEventService $publicEvents,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->header('X-Tenant-Slug')
            ?? $request->input('tenant_slug')
            ?? $request->query('tenant');

        $token = (string) ($request->route('token') ?? $request->query('token') ?? '');
        $version = $request->query('v');
        $tokenVersion = $version !== null ? (int) $version : null;

        $event = $this->publicEvents->resolveEvent(is_string($slug) ? $slug : null, $token, $tokenVersion);

        abort_unless($event && $this->publicEvents->validateAccess($event, $tokenVersion), 403, 'El enlace de reserva no es válido o ha expirado.');

        $request->attributes->set('seat_event', $event);

        return $next($request);
    }
}
