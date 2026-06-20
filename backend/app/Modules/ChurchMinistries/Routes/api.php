<?php

use App\Modules\ChurchMinistries\Http\Controllers\MinistryController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:instructor,admin,student')->group(function () {
    Route::get('/', [MinistryController::class, 'index']);
    Route::get('/{churchMinistry}', [MinistryController::class, 'show']);
});

Route::middleware('role:instructor,admin')->group(function () {
    Route::post('/', [MinistryController::class, 'store']);
});

Route::middleware('role:admin')->group(function () {
    Route::patch('/{churchMinistry}', [MinistryController::class, 'update']);
});
