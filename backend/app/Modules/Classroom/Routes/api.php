<?php

use App\Modules\Classroom\Http\Controllers\ClassController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ClassController::class, 'index']);
Route::get('/{classSession}', [ClassController::class, 'show']);
