<?php

namespace App\Modules\Certificate\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class CertificateServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'Certificate';
    }

    protected function moduleSlug(): string
    {
        return 'certificates';
    }
}
