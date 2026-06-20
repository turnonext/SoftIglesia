<?php

namespace App\Modules\Certificate\Services;

use App\Modules\Certificate\Models\CertificateTemplate;
use App\Modules\Certificate\Support\CertificateTemplateCatalog;
use App\Modules\Shared\Scopes\TenantScope;
use Illuminate\Support\Str;

class CertificateTemplateRepository
{
    /**
     * @return array<int, CertificateTemplate>
     */
    public function listForTenant(string $tenantId): array
    {
        $templates = [];
        foreach (CertificateTemplateCatalog::systemDefinitions() as $key => $definition) {
            $templates[] = $this->resolveSystem($tenantId, $key);
        }

        $custom = CertificateTemplate::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('is_system', false)
            ->orderBy('name')
            ->get();

        return array_merge($templates, $custom->all());
    }

    public function resolveSystem(string $tenantId, string $key): CertificateTemplate
    {
        $existing = CertificateTemplate::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('key', $key)
            ->where('is_system', true)
            ->first();

        if ($existing) {
            return $existing;
        }

        $definition = CertificateTemplateCatalog::systemDefinitions()[$key] ?? null;
        abort_unless($definition, 404, 'Plantilla no encontrada.');

        return CertificateTemplate::query()->withoutGlobalScope(TenantScope::class)->create([
            'tenant_id' => $tenantId,
            'key' => $key,
            'name' => $definition['name'],
            'body_html' => $definition['body_html'],
            'available_variables' => CertificateTemplateCatalog::variables(),
            'is_system' => true,
            'is_active' => true,
        ]);
    }

    public function findForTenant(string $tenantId, string $id): CertificateTemplate
    {
        return CertificateTemplate::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();
    }

    public function createCustom(string $tenantId, string $name, string $bodyHtml, ?string $key = null): CertificateTemplate
    {
        $key ??= Str::slug($name).'-'.Str::lower(Str::random(4));

        return CertificateTemplate::query()->withoutGlobalScope(TenantScope::class)->create([
            'tenant_id' => $tenantId,
            'key' => $key,
            'name' => $name,
            'body_html' => $bodyHtml,
            'available_variables' => CertificateTemplateCatalog::variables(),
            'is_system' => false,
            'is_active' => true,
        ]);
    }
}
