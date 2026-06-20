<?php

namespace App\Modules\Audit\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class AuditServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'Audit';
    }

    protected function moduleSlug(): string
    {
        return 'audit';
    }
}
