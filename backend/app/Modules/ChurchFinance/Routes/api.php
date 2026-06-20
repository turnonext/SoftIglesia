<?php

use App\Modules\ChurchFinance\Http\Controllers\CategoryController;
use App\Modules\ChurchFinance\Http\Controllers\FinanceController;
use App\Modules\ChurchFinance\Http\Controllers\FixedExpenseController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:instructor,admin')->group(function () {
    Route::get('/', [FinanceController::class, 'index']);
    Route::post('/', [FinanceController::class, 'store']);
    Route::get('/charts', [FinanceController::class, 'charts']);
    Route::get('/export', [FinanceController::class, 'exportCsv']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::patch('/categories/{financeCategory}', [CategoryController::class, 'update']);
    Route::delete('/categories/{financeCategory}', [CategoryController::class, 'destroy']);
    Route::get('/fixed-expenses', [FixedExpenseController::class, 'index']);
    Route::post('/fixed-expenses', [FixedExpenseController::class, 'store']);
    Route::get('/fixed-expenses/{financeFixedExpense}', [FixedExpenseController::class, 'show']);
    Route::patch('/fixed-expenses/{financeFixedExpense}', [FixedExpenseController::class, 'update']);
    Route::delete('/fixed-expenses/{financeFixedExpense}', [FixedExpenseController::class, 'destroy']);
    Route::get('/{financeTransaction}', [FinanceController::class, 'show']);
    Route::patch('/{financeTransaction}', [FinanceController::class, 'update']);
    Route::delete('/{financeTransaction}', [FinanceController::class, 'destroy']);
});
