<?php

use App\Modules\Certificate\Http\Controllers\CertificateSignatureController;
use App\Modules\Certificate\Http\Controllers\CertificateTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin,instructor')->group(function () {
    Route::prefix('signatures')->group(function () {
        Route::get('/', [CertificateSignatureController::class, 'index']);
        Route::put('/', [CertificateSignatureController::class, 'update']);
        Route::post('/{slot}/image', [CertificateSignatureController::class, 'uploadImage'])
            ->where('slot', '[1-3]');
        Route::delete('/{slot}/image', [CertificateSignatureController::class, 'removeImage'])
            ->where('slot', '[1-3]');
    });

    Route::prefix('templates')->group(function () {
        Route::get('/', [CertificateTemplateController::class, 'index']);
        Route::post('/', [CertificateTemplateController::class, 'store']);
        Route::get('/demo/download', [CertificateTemplateController::class, 'downloadDemo']);
        Route::get('/system/{key}/download', [CertificateTemplateController::class, 'downloadSystem']);
        Route::get('/{id}', [CertificateTemplateController::class, 'show']);
        Route::put('/{id}', [CertificateTemplateController::class, 'update']);
        Route::delete('/{id}', [CertificateTemplateController::class, 'destroy']);
        Route::post('/{id}/upload', [CertificateTemplateController::class, 'upload']);
        Route::post('/{id}/preview', [CertificateTemplateController::class, 'preview']);
    });
});
