<?php

namespace App\Modules\File\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class FileServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string { return 'File'; }
    protected function moduleSlug(): string { return 'files'; }
}
