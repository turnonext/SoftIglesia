<?php

use App\Modules\ChurchPeople\Http\Controllers\PublicMemberRegistrationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['member.registration', 'throttle:20,1'])->group(function () {
    Route::get('/register/config', [PublicMemberRegistrationController::class, 'config']);
    Route::get('/register/catalogs', [PublicMemberRegistrationController::class, 'catalogs']);
    Route::post('/register', [PublicMemberRegistrationController::class, 'store']);
});
