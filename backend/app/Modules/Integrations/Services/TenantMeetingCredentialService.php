<?php

namespace App\Modules\Integrations\Services;

use App\Modules\Integrations\Models\TenantMeetingCredential;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

class TenantMeetingCredentialService
{
    /**
     * @return array<string, mixed>|null
     */
    public function getDecrypted(string $tenantId, string $provider): ?array
    {
        $row = $this->find($tenantId, $provider);
        if (! $row || ! $row->is_enabled) {
            return null;
        }

        try {
            $json = Crypt::decryptString($row->credentials);

            return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (DecryptException|\JsonException) {
            return null;
        }
    }

    public function find(string $tenantId, string $provider): ?TenantMeetingCredential
    {
        return TenantMeetingCredential::query()
            ->where('tenant_id', $tenantId)
            ->where('provider', $provider)
            ->first();
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    public function upsert(string $tenantId, string $provider, array $credentials, bool $isEnabled = true): TenantMeetingCredential
    {
        $existing = $this->getDecrypted($tenantId, $provider) ?? [];
        $merged = array_merge($existing, array_filter($credentials, fn ($v) => $v !== null && $v !== ''));

        $row = TenantMeetingCredential::query()->updateOrCreate(
            ['tenant_id' => $tenantId, 'provider' => $provider],
            [
                'credentials' => Crypt::encryptString(json_encode($merged, JSON_THROW_ON_ERROR)),
                'is_enabled' => $isEnabled,
            ]
        );

        return $row;
    }

    public function markVerified(string $tenantId, string $provider): void
    {
        TenantMeetingCredential::query()
            ->where('tenant_id', $tenantId)
            ->where('provider', $provider)
            ->update(['verified_at' => now()]);
    }

    /**
     * @return array<string, mixed>
     */
    public function presentStatus(string $tenantId, string $provider): array
    {
        $row = $this->find($tenantId, $provider);
        $data = $row ? ($this->getDecrypted($tenantId, $provider) ?? []) : [];

        return match ($provider) {
            'zoom' => [
                'configured' => $row !== null && ! empty($data['client_id']) && ! empty($data['client_secret']) && ! empty($data['account_id']),
                'is_enabled' => (bool) ($row?->is_enabled ?? false),
                'verified_at' => $row?->verified_at?->toIso8601String(),
                'account_id' => $this->mask($data['account_id'] ?? null),
                'client_id' => $this->mask($data['client_id'] ?? null),
                'has_client_secret' => ! empty($data['client_secret']),
            ],
            'meet' => [
                'configured' => $row !== null && ! empty($data['client_id']) && ! empty($data['client_secret']) && ! empty($data['refresh_token']),
                'is_enabled' => (bool) ($row?->is_enabled ?? false),
                'verified_at' => $row?->verified_at?->toIso8601String(),
                'client_id' => $this->mask($data['client_id'] ?? null),
                'has_client_secret' => ! empty($data['client_secret']),
                'has_refresh_token' => ! empty($data['refresh_token']),
                'calendar_id' => $data['calendar_id'] ?? 'primary',
            ],
            default => ['configured' => false],
        };
    }

    private function mask(?string $value): ?string
    {
        if (! $value || strlen($value) < 6) {
            return $value ? '••••' : null;
        }

        return substr($value, 0, 4).'…'.substr($value, -3);
    }
}
