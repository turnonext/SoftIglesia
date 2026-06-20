<?php

use App\Modules\Shared\Http\Controllers\TenantSettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/settings', [TenantSettingsController::class, 'show']);
Route::middleware('role:admin')->put('/settings', [TenantSettingsController::class, 'update']);
