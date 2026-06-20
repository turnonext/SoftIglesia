<?php

namespace App\Support;

use App\Modules\Auth\Models\User;
use App\Modules\Shared\Models\Tenant;
use Illuminate\Http\Request;

final class PlatformAccess
{
    public const ROLE = 'platform';

    public const ACT_AS_HEADER = 'X-Act-As-Tenant-Slug';

    public static function isPlatformUser(?User $user): bool
    {
        return $user !== null && $user->role === self::ROLE;
    }

    public static function actingTenantSlug(Request $request): ?string
    {
        $slug = $request->header(self::ACT_AS_HEADER);

        return is_string($slug) && $slug !== '' ? $slug : null;
    }

    public static function resolveTenantId(User $user, ?string $actAsSlug = null): string
    {
        if (! self::isPlatformUser($user) || ! $actAsSlug) {
            return $user->tenant_id;
        }

        $tenant = Tenant::query()
            ->where('slug', $actAsSlug)
            ->where('is_active', true)
            ->first();

        return $tenant?->id ?? $user->tenant_id;
    }

    /** Rol efectivo para autorización cuando opera dentro de un tenant. */
    public static function effectiveRole(User $user, ?string $actAsSlug): string
    {
        if (self::isPlatformUser($user) && $actAsSlug) {
            return 'admin';
        }

        return $user->role;
    }
}
