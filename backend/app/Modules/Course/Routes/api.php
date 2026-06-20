<?php

use App\Modules\Course\Http\Controllers\CourseController;
use App\Modules\Course\Http\Controllers\CourseStructureController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CourseController::class, 'index']);
Route::post('/', [CourseController::class, 'store'])->middleware('role:instructor,admin');
Route::post('/preview-structure', [CourseStructureController::class, 'preview'])
    ->middleware('role:instructor,admin');
Route::post('/with-structure', [CourseStructureController::class, 'store'])
    ->middleware('role:instructor,admin');
Route::get('/{course}', [CourseController::class, 'show']);
Route::post('/{course}/publish', [CourseController::class, 'publish'])->middleware('role:instructor,admin');
Route::post('/{course}/unpublish', [CourseController::class, 'unpublish'])->middleware('role:instructor,admin');
Route::post('/{course}/enroll', [CourseController::class, 'enroll'])->middleware('role:student,instructor,admin');
