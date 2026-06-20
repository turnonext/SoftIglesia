<?php

namespace App\Modules\Notification\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class NotificationServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string { return 'Notification'; }
    protected function moduleSlug(): string { return 'notifications'; }
}
