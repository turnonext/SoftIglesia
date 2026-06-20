<?php

namespace App\Modules\Auth\Services;

use App\Modules\Auth\Models\RefreshToken;
use App\Modules\Auth\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RefreshTokenService
{
    public function issue(User $user, Request $request, ?string $familyId = null): array
    {
        $plain = Str::random(64);
        $familyId ??= (string) Str::uuid();

        RefreshToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plain),
            'family_id' => $familyId,
            'expires_at' => now()->addMinutes((int) config('jwt.refresh_ttl', 20160)),
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        return ['plain' => $plain, 'family_id' => $familyId];
    }

    public function rotate(string $plain, Request $request): ?RefreshToken
    {
        $hash = hash('sha256', $plain);

        $token = RefreshToken::query()
            ->where('token_hash', $hash)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $token) {
            return null;
        }

        $token->update(['revoked_at' => now()]);

        RefreshToken::query()
            ->where('family_id', $token->family_id)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        return $token->load('user');
    }
}
