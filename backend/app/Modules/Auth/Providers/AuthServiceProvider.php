<?php

namespace App\Modules\Auth\Providers;

use App\Modules\Shared\Providers\ModuleServiceProvider;

class AuthServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'Auth';
    }

    protected function moduleSlug(): string
    {
        return 'auth';
    }

    protected function protectedMiddleware(): array
    {
        return ['api', 'auth:api'];
    }
}
