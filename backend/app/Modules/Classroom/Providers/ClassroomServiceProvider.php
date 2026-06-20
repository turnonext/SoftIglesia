<?php

namespace App\Modules\Classroom\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class ClassroomServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string { return 'Classroom'; }
    protected function moduleSlug(): string { return 'classes'; }
}
