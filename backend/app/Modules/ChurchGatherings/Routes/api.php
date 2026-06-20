<?php

use App\Modules\ChurchGatherings\Http\Controllers\ChurchGatheringController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:instructor,admin')->group(function () {
    Route::get('/', [ChurchGatheringController::class, 'index']);
    Route::post('/', [ChurchGatheringController::class, 'store']);
    Route::get('/{churchGathering}', [ChurchGatheringController::class, 'show']);
    Route::patch('/{churchGathering}', [ChurchGatheringController::class, 'update']);
    Route::post('/{churchGathering}/checkin', [ChurchGatheringController::class, 'checkin']);
    Route::post('/{churchGathering}/regenerate-checkin', [ChurchGatheringController::class, 'regenerateCheckinToken']);
});
