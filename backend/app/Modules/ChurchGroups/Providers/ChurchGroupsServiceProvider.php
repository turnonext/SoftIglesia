<?php

namespace App\Modules\ChurchGroups\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ChurchGroupsServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'ChurchGroups';
    }

    protected function moduleSlug(): string
    {
        return 'groups';
    }
}
