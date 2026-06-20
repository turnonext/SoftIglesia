<?php

use App\Modules\ChurchPeople\Http\Controllers\MemberController;
use App\Modules\ChurchPeople\Http\Controllers\MemberRegistrationSettingsController;
use App\Modules\ChurchPeople\Http\Controllers\NationalityController;
use App\Modules\ChurchPeople\Http\Controllers\ProfessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:instructor,admin')->group(function () {
    Route::get('/professions', [ProfessionController::class, 'index']);
    Route::get('/nationalities', [NationalityController::class, 'index']);
});

Route::middleware('role:admin')->group(function () {
    Route::post('/professions', [ProfessionController::class, 'store']);
    Route::post('/nationalities', [NationalityController::class, 'store']);
    Route::patch('/members/{member}', [MemberController::class, 'update']);
    Route::get('/register/settings', [MemberRegistrationSettingsController::class, 'show']);
    Route::patch('/register/settings', [MemberRegistrationSettingsController::class, 'update']);
    Route::post('/register/settings/regenerate', [MemberRegistrationSettingsController::class, 'regenerate']);
});

Route::get('/members', [MemberController::class, 'index'])->middleware('role:instructor,admin');
Route::post('/members', [MemberController::class, 'store'])->middleware('role:instructor,admin');
Route::get('/members/{member}', [MemberController::class, 'show'])->middleware('role:instructor,admin');
