<?php

use Illuminate\Support\Facades\Route;

Route::get('/certificates', fn () => response()->json(['data' => [], 'module' => 'academic']));
