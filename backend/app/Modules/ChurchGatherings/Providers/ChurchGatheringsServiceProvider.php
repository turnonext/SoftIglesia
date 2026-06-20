<?php

namespace App\Modules\ChurchGatherings\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ChurchGatheringsServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'ChurchGatherings';
    }

    protected function moduleSlug(): string
    {
        return 'gatherings';
    }
}
