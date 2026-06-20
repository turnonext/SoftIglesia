<?php

namespace App\Modules\Notification\Services;

use App\Modules\Notification\Models\EmailTemplate;
use App\Modules\Notification\Support\EmailTemplateCatalog;
use App\Modules\Shared\Scopes\TenantScope;

class EmailTemplateRepository
{
    /**
     * @return array<int, EmailTemplate>
     */
    public function listForTenant(string $tenantId): array
    {
        $templates = [];
        foreach (EmailTemplateCatalog::definitions() as $key => $definition) {
            $templates[] = $this->resolve($tenantId, $key);
        }

        return $templates;
    }

    public function resolve(string $tenantId, string $key): EmailTemplate
    {
        $existing = EmailTemplate::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('key', $key)
            ->first();

        if ($existing) {
            return $existing;
        }

        $definition = EmailTemplateCatalog::definitions()[$key] ?? null;
        abort_unless($definition, 404, 'Plantilla no encontrada.');

        return EmailTemplate::query()->withoutGlobalScope(TenantScope::class)->create([
            'tenant_id' => $tenantId,
            'key' => $key,
            'name' => $definition['name'],
            'subject' => $definition['subject'],
            'body_html' => $definition['body_html'],
            'available_variables' => $definition['available_variables'],
            'is_active' => true,
        ]);
    }
}
