<?php

namespace App\Modules\User\Services;

use App\Modules\Auth\Models\User;
use App\Modules\User\Models\UserProfile;

class TenantUserPresenter
{
    /**
     * @return array<string, mixed>
     */
    public function present(User $user, ?UserProfile $profile = null): array
    {
        $firstName = $profile?->first_name ?? '';
        $lastName = $profile?->last_name ?? '';
        $displayName = trim("{$firstName} {$lastName}") ?: $user->email;

        return [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'first_name' => $profile?->first_name,
            'last_name' => $profile?->last_name,
            'display_name' => $displayName,
            'created_at' => $user->created_at?->toAtomString(),
            'last_login_at' => $user->last_login_at?->toAtomString(),
        ];
    }
}
