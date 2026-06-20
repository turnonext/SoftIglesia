<?php

namespace App\Modules\Attendance\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class AttendanceServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string { return 'Attendance'; }
    protected function moduleSlug(): string { return 'attendance'; }
}
