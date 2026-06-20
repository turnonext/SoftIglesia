<?php

namespace App\Modules\ChurchCampuses\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ChurchCampusesServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'ChurchCampuses';
    }

    protected function moduleSlug(): string
    {
        return 'campuses';
    }
}
