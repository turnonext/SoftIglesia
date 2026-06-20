<?php

namespace App\Modules\ChurchMinistries\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ChurchMinistriesServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'ChurchMinistries';
    }

    protected function moduleSlug(): string
    {
        return 'ministries';
    }
}
