<?php

use App\Modules\File\Http\Controllers\FileController;
use Illuminate\Support\Facades\Route;

Route::get('/', [FileController::class, 'index']);
Route::post('/upload', [FileController::class, 'store']);
Route::get('/{file}/download', [FileController::class, 'download']);
