<?php

use App\Modules\Audit\Http\Controllers\AccessLogController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin')->prefix('access-logs')->group(function () {
    Route::get('/', [AccessLogController::class, 'index']);
});
