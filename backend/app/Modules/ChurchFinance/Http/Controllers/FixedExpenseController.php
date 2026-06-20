<?php

namespace App\Modules\ChurchFinance\Http\Controllers;

use App\Modules\ChurchFinance\Models\FinanceCategory;
use App\Modules\ChurchFinance\Models\FinanceFixedExpense;
use App\Modules\ChurchFinance\Services\FinanceCategorySeeder;
use App\Modules\ChurchFinance\Services\FixedExpenseService;
use App\Modules\ChurchFinance\Support\SupportedCurrencies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class FixedExpenseController extends Controller
{
    public function index(Request $request, FixedExpenseService $fixedExpenses, FinanceCategorySeeder $categorySeeder): JsonResponse
    {
        $categorySeeder->seedDefaults();
        $currency = SupportedCurrencies::normalize((string) $request->query('currency', SupportedCurrencies::DEFAULT));

        return response()->json([
            'data' => $fixedExpenses->allForCurrency($currency),
            'summary' => $fixedExpenses->summary($currency),
            'categories' => FinanceCategory::query()
                ->where('is_active', true)
                ->whereIn('group', ['expense', 'assets'])
                ->orderByRaw("CASE `group` WHEN 'expense' THEN 1 WHEN 'assets' THEN 2 ELSE 3 END")
                ->orderBy('name')
                ->get(['id', 'group', 'name', 'type']),
        ]);
    }

    public function show(FinanceFixedExpense $financeFixedExpense): JsonResponse
    {
        $financeFixedExpense->load(['category:id,group,name,type']);

        return response()->json(['data' => $financeFixedExpense]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);

        $payload = $this->validatedPayload($request);
        $item = FinanceFixedExpense::query()->create($payload);

        return response()->json([
            'data' => $item->load(['category:id,group,name,type']),
            'message' => 'Gasto fijo registrado.',
        ], 201);
    }

    public function update(Request $request, FinanceFixedExpense $financeFixedExpense): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $payload = $this->validatedPayload($request, partial: true);
        $financeFixedExpense->fill($payload)->save();

        return response()->json([
            'data' => $financeFixedExpense->fresh(['category:id,group,name,type']),
            'message' => 'Gasto fijo actualizado.',
        ]);
    }

    public function destroy(FinanceFixedExpense $financeFixedExpense): JsonResponse
    {
        abort_unless(request()->user()?->role === 'admin', 403);

        $financeFixedExpense->delete();

        return response()->json(['message' => 'Gasto fijo eliminado.']);
    }

    private function validatedPayload(Request $request, bool $partial = false): array
    {
        $rules = [
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:120'],
            'amount' => [$partial ? 'sometimes' : 'required', 'numeric', 'min:0.01'],
            'currency' => [$partial ? 'sometimes' : 'required', 'string', Rule::in(SupportedCurrencies::ALL)],
            'frequency' => [$partial ? 'sometimes' : 'required', 'in:monthly,weekly,yearly'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'category_id' => ['nullable', 'string', 'max:26'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];

        $payload = $request->validate($rules);

        if (isset($payload['currency'])) {
            $payload['currency'] = strtoupper($payload['currency']);
        }

        if (($payload['frequency'] ?? 'monthly') !== 'monthly') {
            $payload['due_day'] = null;
        }

        return $payload;
    }
}
