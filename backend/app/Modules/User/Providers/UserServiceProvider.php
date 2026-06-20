<?php

namespace App\Modules\User\Providers;

use App\Modules\Auth\Models\User;
use App\Modules\Shared\Providers\ModuleServiceProvider;
use App\Modules\Shared\Scopes\TenantScope;
use Illuminate\Support\Facades\Route;

class UserServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string { return 'User'; }

    protected function moduleSlug(): string { return 'users'; }

    public function boot(): void
    {
        parent::boot();

        Route::bind('user', function (string $value) {
            $actor = auth()->user();
            abort_unless($actor, 401);

            return User::query()
                ->withoutGlobalScope(TenantScope::class)
                ->where('id', $value)
                ->where('tenant_id', $actor->tenant_id)
                ->firstOrFail();
        });
    }
}
