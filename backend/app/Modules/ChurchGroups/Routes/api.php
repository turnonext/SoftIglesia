<?php

use App\Modules\ChurchGroups\Http\Controllers\ChurchGroupController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:instructor,admin')->group(function () {
    Route::get('/map', [ChurchGroupController::class, 'map']);
    Route::get('/', [ChurchGroupController::class, 'index']);
    Route::post('/', [ChurchGroupController::class, 'store']);
    Route::get('/{churchGroup}', [ChurchGroupController::class, 'show']);
    Route::patch('/{churchGroup}', [ChurchGroupController::class, 'update']);
});
