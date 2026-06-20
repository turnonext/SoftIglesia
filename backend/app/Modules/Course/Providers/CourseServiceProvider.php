<?php

namespace App\Modules\Course\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class CourseServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string { return 'Course'; }
    protected function moduleSlug(): string { return 'courses'; }
}
