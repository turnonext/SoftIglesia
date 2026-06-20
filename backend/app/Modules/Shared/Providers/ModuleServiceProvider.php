<?php

namespace App\Modules\Shared\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

abstract class ModuleServiceProvider extends ServiceProvider
{
    abstract protected function moduleName(): string;

    abstract protected function moduleSlug(): string;

    public function boot(): void
    {
        $this->loadMigrationsFrom($this->modulePath('Database/Migrations'));

        $publicRoutes = $this->modulePath('Routes/api-public.php');
        if (file_exists($publicRoutes)) {
            Route::prefix('api/v1/'.$this->moduleSlug())
                ->middleware('api')
                ->group($publicRoutes);
        }

        $protectedRoutes = $this->modulePath('Routes/api.php');
        if (file_exists($protectedRoutes)) {
            Route::prefix('api/v1/'.$this->moduleSlug())
                ->middleware($this->protectedMiddleware())
                ->group($protectedRoutes);
        }
    }

    /** @return array<int, string> */
    protected function protectedMiddleware(): array
    {
        return ['api', 'auth:api', \App\Http\Middleware\IdentifyTenant::class];
    }

    protected function modulePath(string $path = ''): string
    {
        $base = app_path('Modules/'.$this->moduleName());

        return $path ? $base.'/'.$path : $base;
    }
}
