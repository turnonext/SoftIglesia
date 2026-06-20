<?php

use App\Modules\ChurchSpaces\Http\Controllers\SpaceAvailabilityController;
use App\Modules\ChurchSpaces\Http\Controllers\SpaceController;
use App\Modules\ChurchSpaces\Http\Controllers\SpaceReservationController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin,instructor,student')->group(function () {
    Route::prefix('reservations')->group(function () {
        Route::get('/', [SpaceReservationController::class, 'index']);
        Route::post('/', [SpaceReservationController::class, 'store']);
        Route::post('/check', [SpaceAvailabilityController::class, 'check']);
        Route::post('/series/{seriesId}/cancel', [SpaceReservationController::class, 'cancelSeries']);
        Route::patch('/{churchSpaceReservation}', [SpaceReservationController::class, 'update']);
        Route::post('/{churchSpaceReservation}/cancel', [SpaceReservationController::class, 'cancel']);
        Route::post('/{churchSpaceReservation}/reactivate', [SpaceReservationController::class, 'reactivate']);
        Route::post('/{churchSpaceReservation}/approve', [SpaceReservationController::class, 'approve']);
        Route::delete('/{churchSpaceReservation}', [SpaceReservationController::class, 'destroy']);
    });

    Route::get('/availability', [SpaceAvailabilityController::class, 'index']);
    Route::get('/', [SpaceController::class, 'index']);

    Route::middleware('role:admin,instructor')->group(function () {
        Route::get('/{churchSpace}/layout-removal-check', [SpaceController::class, 'layoutRemovalCheck']);
        Route::post('/layout', [SpaceController::class, 'updateLayout']);
        Route::post('/', [SpaceController::class, 'store']);
        Route::patch('/{churchSpace}/appearance', [SpaceController::class, 'updateAppearance']);
        Route::patch('/{churchSpace}', [SpaceController::class, 'update']);
    });

    Route::get('/{churchSpace}', [SpaceController::class, 'show']);
});
