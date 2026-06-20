<?php

use App\Modules\Notification\Http\Controllers\EmailTemplateController;
use App\Modules\Notification\Http\Controllers\NotificationFeedController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin,instructor,student,platform')->prefix('feed')->group(function () {
    Route::get('/', [NotificationFeedController::class, 'index']);
    Route::post('/read', [NotificationFeedController::class, 'markRead']);
    Route::post('/read-all', [NotificationFeedController::class, 'markAllRead']);
});

Route::middleware('role:admin')->prefix('email-templates')->group(function () {
    Route::get('/', [EmailTemplateController::class, 'index']);
    Route::get('/{key}', [EmailTemplateController::class, 'show']);
    Route::put('/{key}', [EmailTemplateController::class, 'update']);
    Route::post('/{key}/preview', [EmailTemplateController::class, 'preview']);
});
