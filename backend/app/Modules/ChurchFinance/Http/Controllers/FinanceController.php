<?php



namespace App\Modules\ChurchFinance\Http\Controllers;



use App\Modules\ChurchFinance\Models\FinanceCategory;
use App\Modules\ChurchFinance\Models\FinanceTransaction;
use App\Modules\ChurchFinance\Services\FinanceAnalyticsService;
use App\Modules\ChurchFinance\Services\FinanceCategorySeeder;
use App\Modules\ChurchFinance\Services\FixedExpenseService;
use App\Modules\ChurchFinance\Support\SupportedCurrencies;

use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;

use Illuminate\Routing\Controller;

use Illuminate\Validation\Rule;

use Symfony\Component\HttpFoundation\StreamedResponse;



class FinanceController extends Controller

{

    public function index(Request $request, FinanceCategorySeeder $categorySeeder): JsonResponse

    {

        $categorySeeder->seedDefaults();

        $search = trim((string) $request->query('q', ''));

        $donor = trim((string) $request->query('donor', ''));

        $kind = $request->query('kind');

        $categoryId = $request->query('category_id');

        $currency = SupportedCurrencies::normalize((string) $request->query('currency', SupportedCurrencies::DEFAULT));

        $from = $request->query('from');

        $to = $request->query('to');



        $query = FinanceTransaction::query()

            ->with([

                'category:id,group,name,type',

                'campus:id,name',

            ])

            ->where('currency', $currency)

            ->when(in_array($kind, ['tithes', 'offering', 'income', 'expense'], true), fn ($q) => $q->where('kind', $kind))

            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))

            ->when($from, fn ($q) => $q->whereDate('occurred_on', '>=', $from))

            ->when($to, fn ($q) => $q->whereDate('occurred_on', '<=', $to))

            ->when($search !== '', function ($q) use ($search) {

                $q->where(function ($inner) use ($search) {

                    $inner

                        ->where('reference', 'like', "%{$search}%")

                        ->orWhere('description', 'like', "%{$search}%");

                });

            })

            ->when($donor !== '', fn ($q) => $q->where('donor_name', 'like', "%{$donor}%"))

            ->orderByDesc('occurred_on')

            ->orderByDesc('created_at');



        $perPage = min(80, max(10, (int) $request->query('per_page', 30)));

        $paginated = $query->paginate($perPage);



        return response()->json([

            'data' => $paginated->items(),

            'meta' => [

                'current_page' => $paginated->currentPage(),

                'last_page' => $paginated->lastPage(),

                'per_page' => $paginated->perPage(),

                'total' => $paginated->total(),

            ],

            'summary' => $this->buildSummary($currency, app(FixedExpenseService::class)),

            'categories' => FinanceCategory::query()

                ->where('is_active', true)

                ->orderByRaw("CASE `group` WHEN 'income' THEN 1 WHEN 'expense' THEN 2 WHEN 'assets' THEN 3 WHEN 'cash_banks' THEN 4 WHEN 'transfers' THEN 5 ELSE 6 END")

                ->orderBy('name')

                ->get(['id', 'group', 'name', 'type']),

            'currencies' => SupportedCurrencies::ALL,

        ]);

    }



    public function show(FinanceTransaction $financeTransaction): JsonResponse

    {

        $financeTransaction->load(['category:id,group,name,type', 'campus:id,name']);



        return response()->json(['data' => $financeTransaction]);

    }



    public function store(Request $request): JsonResponse

    {

        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);



        $payload = $this->validatedPayload($request);



        $transaction = FinanceTransaction::query()->create($payload);



        return response()->json([

            'data' => $transaction->load(['category:id,group,name,type', 'campus:id,name']),

            'message' => 'Movimiento registrado.',

        ], 201);

    }



    public function update(Request $request, FinanceTransaction $financeTransaction): JsonResponse

    {

        abort_unless($request->user()?->role === 'admin', 403);



        $payload = $this->validatedPayload($request, partial: true);

        $financeTransaction->fill($payload)->save();



        return response()->json([

            'data' => $financeTransaction->fresh(['category:id,group,name,type', 'campus:id,name']),

            'message' => 'Movimiento actualizado.',

        ]);

    }



    public function destroy(FinanceTransaction $financeTransaction): JsonResponse

    {

        abort_unless(request()->user()?->role === 'admin', 403);



        $financeTransaction->delete();



        return response()->json(['message' => 'Movimiento eliminado.']);

    }



    public function charts(Request $request, FinanceAnalyticsService $analytics): JsonResponse
    {
        $currency = SupportedCurrencies::normalize((string) $request->query('currency', SupportedCurrencies::DEFAULT));
        $from = $request->query('from');
        $to = $request->query('to');

        return response()->json([
            'data' => $analytics->build($currency, is_string($from) ? $from : null, is_string($to) ? $to : null),
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse

    {

        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);



        $kind = $request->query('kind');

        $currency = SupportedCurrencies::normalize((string) $request->query('currency', SupportedCurrencies::DEFAULT));

        $from = $request->query('from');

        $to = $request->query('to');



        $rows = FinanceTransaction::query()

            ->with(['category:id,name', 'campus:id,name'])

            ->where('currency', $currency)

            ->when(in_array($kind, ['tithes', 'offering', 'income', 'expense'], true), fn ($q) => $q->where('kind', $kind))

            ->when($from, fn ($q) => $q->whereDate('occurred_on', '>=', $from))

            ->when($to, fn ($q) => $q->whereDate('occurred_on', '<=', $to))

            ->orderByDesc('occurred_on')

            ->limit(2000)

            ->get();



        $filename = 'finance-export-'.now()->format('Ymd-His').'.csv';



        return response()->streamDownload(function () use ($rows): void {

            $out = fopen('php://output', 'w');

            fputcsv($out, ['date', 'kind', 'amount', 'currency', 'category', 'treasury', 'reference', 'donor_name', 'description']);

            foreach ($rows as $row) {

                fputcsv($out, [

                    $row->occurred_on?->format('Y-m-d'),

                    $row->kind,

                    $row->amount,

                    $row->currency,

                    $row->category?->name,

                    $row->campus?->name,

                    $row->reference,

                    $row->donor_name,

                    $row->description,

                ]);

            }

            fclose($out);

        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);

    }



    private function validatedPayload(Request $request, bool $partial = false): array

    {

        $rules = [

            'kind' => [$partial ? 'sometimes' : 'required', 'in:tithes,offering,income,expense'],

            'amount' => [$partial ? 'sometimes' : 'required', 'numeric', 'min:0.01'],

            'currency' => [$partial ? 'sometimes' : 'required', 'string', Rule::in(SupportedCurrencies::ALL)],

            'occurred_on' => [$partial ? 'sometimes' : 'required', 'date'],

            'category_id' => ['nullable', 'string', 'max:26'],

            'campus_id' => ['nullable', 'string', 'max:26'],

            'reference' => ['nullable', 'string', 'max:80'],

            'donor_name' => ['nullable', 'string', 'max:160'],

            'description' => ['nullable', 'string', 'max:255'],

        ];



        $payload = $request->validate($rules);



        if (isset($payload['currency'])) {

            $payload['currency'] = strtoupper($payload['currency']);

        }



        return $payload;

    }



    private function buildSummary(string $currency, FixedExpenseService $fixedExpenses): array

    {

        $monthStart = now()->startOfMonth()->toDateString();

        $monthEnd = now()->endOfMonth()->toDateString();

        $yearStart = now()->startOfYear()->toDateString();



        $monthRows = FinanceTransaction::query()

            ->where('currency', $currency)

            ->whereBetween('occurred_on', [$monthStart, $monthEnd])

            ->get(['kind', 'amount']);



        $yearRows = FinanceTransaction::query()

            ->where('currency', $currency)

            ->whereDate('occurred_on', '>=', $yearStart)

            ->get(['kind', 'amount']);



        $month = $this->aggregateAmounts($monthRows);

        $year = $this->aggregateAmounts($yearRows);

        $fixedMonthly = $fixedExpenses->monthlyTotal($currency);



        return [

            'currency' => $currency,

            'month' => [

                'income' => $month['total_income'],

                'expense' => $month['total_expense'],

                'balance' => $month['balance'],

                'label' => now()->translatedFormat('F Y'),

            ],

            'year' => [

                'balance' => $year['balance'],

                'label' => (string) now()->year,

            ],

            'total_income' => $month['total_income'],

            'total_expense' => $month['total_expense'],

            'balance' => $month['balance'],

            'by_kind' => $month['by_kind'],

            'fixed_expenses' => [

                'monthly_total' => $fixedMonthly,

                'active_count' => $fixedExpenses->activeForCurrency($currency)->count(),

                'projected_month_balance' => round($month['balance'] - $fixedMonthly, 2),

            ],

        ];

    }



    private function aggregateAmounts($rows): array

    {

        $summary = [

            'total_income' => 0.0,

            'total_expense' => 0.0,

            'balance' => 0.0,

            'by_kind' => [

                'tithes' => 0.0,

                'offering' => 0.0,

                'income' => 0.0,

                'expense' => 0.0,

            ],

        ];



        foreach ($rows as $row) {

            $amount = (float) $row->amount;

            $summary['by_kind'][$row->kind] += $amount;

            if ($row->kind === 'expense') {

                $summary['total_expense'] += $amount;

            } else {

                $summary['total_income'] += $amount;

            }

        }



        $summary['balance'] = $summary['total_income'] - $summary['total_expense'];



        return $summary;

    }

}

