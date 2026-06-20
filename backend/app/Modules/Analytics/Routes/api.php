<?php

use App\Modules\Analytics\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', DashboardController::class);
