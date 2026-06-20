<?php

namespace App\Modules\Certificate\Services;

use App\Modules\Certificate\Models\CertificateSignature;
use App\Modules\Certificate\Support\CertificateSignatures;
use App\Modules\Shared\Scopes\TenantScope;

class CertificateSignatureRepository
{
    /**
     * @return array<int, array{enabled: bool, name: string, title: string, image_path: string|null}>
     */
    public function normalizedForTenant(string $tenantId): array
    {
        $rows = $this->ensureSlots($tenantId);

        return array_map(
            fn (CertificateSignature $row) => [
                'enabled' => $row->enabled,
                'name' => $row->name,
                'title' => $row->title,
                'image_path' => $row->image_path,
            ],
            $rows
        );
    }

    /**
     * @return array<int, CertificateSignature>
     */
    public function ensureSlots(string $tenantId): array
    {
        $defaults = CertificateSignatures::defaults();

        for ($slot = 1; $slot <= CertificateSignatures::MAX_SLOTS; $slot++) {
            CertificateSignature::query()->withoutGlobalScope(TenantScope::class)->firstOrCreate(
                ['tenant_id' => $tenantId, 'slot' => $slot],
                [
                    'enabled' => $defaults[$slot - 1]['enabled'],
                    'name' => $defaults[$slot - 1]['name'],
                    'title' => $defaults[$slot - 1]['title'],
                ]
            );
        }

        return CertificateSignature::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->orderBy('slot')
            ->get()
            ->all();
    }

    public function findSlot(string $tenantId, int $slot): CertificateSignature
    {
        $this->ensureSlots($tenantId);

        return CertificateSignature::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('slot', $slot)
            ->firstOrFail();
    }

    /**
     * @param  array<int, mixed>  $incoming
     * @return array<int, CertificateSignature>
     */
    public function updateFromInput(string $tenantId, array $incoming): array
    {
        $rows = $this->ensureSlots($tenantId);
        $existing = $this->normalizedForTenant($tenantId);
        $merged = CertificateSignatures::mergeFromInput($incoming, $existing);

        foreach ($rows as $i => $row) {
            $row->update([
                'enabled' => $merged[$i]['enabled'],
                'name' => $merged[$i]['name'],
                'title' => $merged[$i]['title'],
            ]);
        }

        return $this->ensureSlots($tenantId);
    }
}
