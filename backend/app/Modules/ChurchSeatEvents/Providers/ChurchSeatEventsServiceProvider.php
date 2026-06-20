<?php

namespace App\Modules\ChurchSeatEvents\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ChurchSeatEventsServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'ChurchSeatEvents';
    }

    protected function moduleSlug(): string
    {
        return 'seat-events';
    }
}
