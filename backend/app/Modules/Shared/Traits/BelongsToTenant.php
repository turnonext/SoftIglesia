<?php

namespace App\Modules\Shared\Traits;

use App\Modules\Shared\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model): void {
            if (empty($model->tenant_id) && app()->bound('current.tenant_id')) {
                $model->tenant_id = app('current.tenant_id');
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Shared\Models\Tenant::class, 'tenant_id');
    }
}
