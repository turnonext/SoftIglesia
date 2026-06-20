<?php

namespace App\Modules\Platform\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class PlatformServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'Platform';
    }

    protected function moduleSlug(): string
    {
        return 'platform';
    }
}
