<?php

use App\Modules\ChurchSeatEvents\Http\Controllers\SeatEventController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin,instructor,student')->group(function () {
    Route::get('/', [SeatEventController::class, 'index']);
    Route::get('/{churchSeatEvent}', [SeatEventController::class, 'show']);

    Route::middleware('role:admin,instructor')->group(function () {
        Route::post('/', [SeatEventController::class, 'store']);
        Route::patch('/{churchSeatEvent}', [SeatEventController::class, 'update']);
        Route::post('/{churchSeatEvent}/regenerate-token', [SeatEventController::class, 'regenerateToken']);
        Route::post('/{churchSeatEvent}/toggle-pause-reservations', [SeatEventController::class, 'togglePauseReservations']);
        Route::post('/{churchSeatEvent}/deactivate', [SeatEventController::class, 'deactivate']);
        Route::post('/{churchSeatEvent}/reactivate', [SeatEventController::class, 'reactivate']);
        Route::delete('/{churchSeatEvent}', [SeatEventController::class, 'destroy']);
        Route::get('/{churchSeatEvent}/seats', [SeatEventController::class, 'seats']);
        Route::get('/{churchSeatEvent}/reservations', [SeatEventController::class, 'reservations']);
        Route::post('/{churchSeatEvent}/seats/{seat}/toggle-block', [SeatEventController::class, 'toggleSeatBlock']);
    });
});
