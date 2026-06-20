<?php

use App\Modules\User\Http\Controllers\ProfileController;
use App\Modules\User\Http\Controllers\TenantUserController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin')->group(function () {
    Route::get('/', [TenantUserController::class, 'index']);
    Route::patch('/{user}', [TenantUserController::class, 'update']);
});

Route::get('/profile', [ProfileController::class, 'show']);
Route::put('/profile', [ProfileController::class, 'update']);
Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
Route::get('/profile/avatar', [ProfileController::class, 'avatar']);
