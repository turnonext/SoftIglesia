<?php

use App\Modules\ChurchCampuses\Http\Controllers\CampusController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:instructor,admin')->group(function () {
    Route::get('/', [CampusController::class, 'index']);
    Route::post('/', [CampusController::class, 'store']);
    Route::get('/{churchCampus}', [CampusController::class, 'show']);
});

Route::middleware('role:admin')->group(function () {
    Route::patch('/{churchCampus}', [CampusController::class, 'update']);
});
