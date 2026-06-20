<?php

namespace App\Modules\ChurchPeople\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ChurchPeopleServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'ChurchPeople';
    }

    protected function moduleSlug(): string
    {
        return 'people';
    }
}
