<?php

namespace App\Modules\Integrations\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class IntegrationsServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'Integrations';
    }

    protected function moduleSlug(): string
    {
        return 'integrations';
    }
}
