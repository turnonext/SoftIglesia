<?php

use App\Modules\ChurchSeatEvents\Http\Controllers\PublicSeatReservationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['seat.event.reservation', 'throttle:60,1'])->prefix('public')->group(function () {
    Route::get('/{token}', [PublicSeatReservationController::class, 'show']);
    Route::get('/{token}/captcha', [PublicSeatReservationController::class, 'captcha']);
    Route::get('/{token}/seats', [PublicSeatReservationController::class, 'seatStatus']);
    Route::post('/{token}/hold', [PublicSeatReservationController::class, 'hold']);
    Route::post('/{token}/release', [PublicSeatReservationController::class, 'release']);
    Route::post('/{token}/confirm', [PublicSeatReservationController::class, 'confirm']);
});
