<?php

namespace App\Modules\ChurchSeatEvents\Services;

use App\Modules\ChurchSeatEvents\Models\ChurchSeatEvent;
use App\Modules\Shared\Models\Tenant;

class PublicSeatEventService
{
    public function resolveEvent(?string $tenantSlug, string $token, ?int $tokenVersion = null): ?ChurchSeatEvent
    {
        if (! $tenantSlug) {
            return null;
        }

        $tenant = Tenant::query()->where('slug', $tenantSlug)->first();

        if (! $tenant) {
            return null;
        }

        app()->instance('current.tenant_id', $tenant->id);
        app()->instance('current.tenant', $tenant);

        $query = ChurchSeatEvent::query()
            ->where('reservation_token', $token);

        if ($tokenVersion !== null) {
            $query->where('token_version', $tokenVersion);
        }

        return $query->first();
    }

    public function validateAccess(ChurchSeatEvent $event, ?int $tokenVersion = null): bool
    {
        if ($tokenVersion !== null && (int) $event->token_version !== $tokenVersion) {
            return false;
        }

        return in_array($event->status, ['active', 'paused'], true);
    }
}
