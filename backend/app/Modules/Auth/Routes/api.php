<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/me', [AuthController::class, 'me']);
Route::post('/logout', [AuthController::class, 'logout']);
