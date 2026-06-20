<?php

namespace App\Modules\ChurchFinance\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ChurchFinanceServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'ChurchFinance';
    }

    protected function moduleSlug(): string
    {
        return 'finance';
    }
}
