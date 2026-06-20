<?php

namespace App\Modules\Academic\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class AcademicServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string { return 'Academic'; }
    protected function moduleSlug(): string { return 'academic'; }
}
