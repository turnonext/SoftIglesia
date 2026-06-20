<?php

namespace App\Modules\Analytics\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class AnalyticsServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string { return 'Analytics'; }
    protected function moduleSlug(): string { return 'analytics'; }
}
