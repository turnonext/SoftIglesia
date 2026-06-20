<?php

namespace App\Modules\Shared\Providers;

use Illuminate\Support\ServiceProvider;

class SharedServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(app_path('Modules/Shared/Database/Migrations'));
    }
}
