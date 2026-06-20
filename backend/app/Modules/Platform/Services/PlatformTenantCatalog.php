<?php

namespace App\Modules\Platform\Services;

use App\Modules\Shared\Models\Tenant;
use Illuminate\Support\Collection;

class PlatformTenantCatalog
{
    public function __construct(
        private readonly PlatformTenantStatsService $stats,
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listForOwner(): array
    {
        return Tenant::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Tenant $tenant) => $this->present($tenant))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function present(Tenant $tenant): array
    {
        $stats = $this->stats->snapshot($tenant->id);

        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'plan' => $tenant->plan,
            'is_active' => $tenant->is_active,
            'created_at' => $tenant->created_at?->toAtomString(),
            'stats' => $stats,
            // Compatibilidad con clientes que lean users_count en la raíz
            'users_count' => $stats['users'],
        ];
    }
}
