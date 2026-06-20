<?php

namespace App\Modules\Shared\Providers;

class TenantApiServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'Shared';
    }

    protected function moduleSlug(): string
    {
        return 'tenant';
    }
}
