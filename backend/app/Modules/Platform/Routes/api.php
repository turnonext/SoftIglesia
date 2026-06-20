<?php

use App\Modules\Platform\Http\Controllers\PlatformController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:platform')->group(function () {
    Route::get('/tenants', [PlatformController::class, 'tenants']);
    Route::get('/context', [PlatformController::class, 'context']);
});
