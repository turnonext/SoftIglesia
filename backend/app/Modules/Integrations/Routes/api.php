<?php

use App\Modules\Integrations\Http\Controllers\MeetingIntegrationController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin')->group(function () {
    Route::get('/meeting-providers', [MeetingIntegrationController::class, 'index']);
    Route::put('/meeting-providers/zoom', [MeetingIntegrationController::class, 'updateZoom']);
    Route::put('/meeting-providers/meet', [MeetingIntegrationController::class, 'updateMeet']);
    Route::post('/meeting-providers/{provider}/test', [MeetingIntegrationController::class, 'test']);
});
