<?php

namespace App\Modules\ChurchSpaces\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ChurchSpacesServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'ChurchSpaces';
    }

    protected function moduleSlug(): string
    {
        return 'spaces';
    }
}
