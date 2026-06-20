<?php

namespace App\Modules\ChurchFinance\Services;

use App\Modules\ChurchFinance\Models\FinanceTransaction;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class FinanceAnalyticsService
{
    public function __construct(private readonly FixedExpenseService $fixedExpenses) {}

    /**
     * @return array<string, mixed>
     */
    public function build(string $currency, ?string $from, ?string $to): array
    {
        $end = $to ? Carbon::parse($to)->endOfDay() : now()->endOfDay();
        $start = $from ? Carbon::parse($from)->startOfDay() : $end->copy()->subMonths(5)->startOfMonth();

        if ($start->gt($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        $rows = FinanceTransaction::query()
            ->with('category:id,group,name,type')
            ->where('currency', $currency)
            ->whereDate('occurred_on', '>=', $start->toDateString())
            ->whereDate('occurred_on', '<=', $end->toDateString())
            ->orderBy('occurred_on')
            ->get(['id', 'kind', 'amount', 'occurred_on', 'category_id']);

        $fixedSummary = $this->fixedExpenses->summary($currency, $start, $end);
        $metrics = $this->metrics($rows, $fixedSummary);
        $granularity = $this->resolveGranularity($start, $end);

        return [
            'currency' => $currency,
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'granularity' => $granularity,
            'metrics' => $metrics,
            'fixed_expenses' => $fixedSummary,
            'trend' => $this->trend($rows, $start, $end, $granularity, $fixedSummary['monthly_total']),
            'by_kind' => $this->byKind($rows),
            'by_category' => $this->mergeCategoryBreakdown($rows, $fixedSummary['by_category']),
        ];
    }

    private function resolveGranularity(Carbon $start, Carbon $end): string
    {
        $days = $start->diffInDays($end) + 1;

        if ($days <= 45) {
            return 'day';
        }

        if ($days <= 120) {
            return 'week';
        }

        return 'month';
    }

    private function metrics(Collection $rows, array $fixedSummary): array
    {
        $income = 0.0;
        $expense = 0.0;

        foreach ($rows as $row) {
            $amount = (float) $row->amount;
            if ($row->kind === 'expense') {
                $expense += $amount;
            } else {
                $income += $amount;
            }
        }

        $fixedMonthly = (float) ($fixedSummary['monthly_total'] ?? 0);
        $fixedPeriod = (float) ($fixedSummary['period_total'] ?? 0);

        return [
            'total_income' => round($income, 2),
            'total_expense' => round($expense, 2),
            'balance' => round($income - $expense, 2),
            'transaction_count' => $rows->count(),
            'fixed_expense_monthly' => round($fixedMonthly, 2),
            'fixed_expense_period' => round($fixedPeriod, 2),
            'projected_balance' => round($income - $expense - $fixedPeriod, 2),
        ];
    }

    private function trend(Collection $rows, Carbon $start, Carbon $end, string $granularity, float $monthlyFixed): array
    {
        $buckets = [];

        foreach ($this->periodKeys($start, $end, $granularity) as $key => $meta) {
            $buckets[$key] = [
                'key' => $key,
                'label' => $meta['label'],
                'income' => 0.0,
                'expense' => 0.0,
                'fixed_expense' => $this->fixedForBucket($granularity, $monthlyFixed),
                'balance' => 0.0,
            ];
        }

        foreach ($rows as $row) {
            $date = Carbon::parse($row->occurred_on);
            $key = match ($granularity) {
                'day' => $date->format('Y-m-d'),
                'week' => $date->copy()->startOfWeek(Carbon::MONDAY)->format('Y-m-d'),
                default => $date->format('Y-m'),
            };

            if (! isset($buckets[$key])) {
                continue;
            }

            $amount = (float) $row->amount;
            if ($row->kind === 'expense') {
                $buckets[$key]['expense'] += $amount;
            } else {
                $buckets[$key]['income'] += $amount;
            }
        }

        return array_values(array_map(function (array $bucket) {
            $bucket['income'] = round($bucket['income'], 2);
            $bucket['expense'] = round($bucket['expense'], 2);
            $bucket['fixed_expense'] = round($bucket['fixed_expense'], 2);
            $bucket['balance'] = round($bucket['income'] - $bucket['expense'], 2);

            return $bucket;
        }, $buckets));
    }

    private function fixedForBucket(string $granularity, float $monthlyFixed): float
    {
        return match ($granularity) {
            'day' => $monthlyFixed / 30,
            'week' => $monthlyFixed / 4.33,
            default => $monthlyFixed,
        };
    }

    /**
     * @return array<string, array{label: string}>
     */
    private function periodKeys(Carbon $start, Carbon $end, string $granularity): array
    {
        $keys = [];

        if ($granularity === 'day') {
            foreach (CarbonPeriod::create($start->copy()->startOfDay(), '1 day', $end->copy()->startOfDay()) as $date) {
                $key = $date->format('Y-m-d');
                $keys[$key] = ['label' => $date->translatedFormat('d M')];
            }

            return $keys;
        }

        if ($granularity === 'week') {
            $cursor = $start->copy()->startOfWeek(Carbon::MONDAY);
            $last = $end->copy()->startOfWeek(Carbon::MONDAY);

            while ($cursor->lte($last)) {
                $key = $cursor->format('Y-m-d');
                $keys[$key] = ['label' => 'Sem '.$cursor->translatedFormat('d M')];
                $cursor->addWeek();
            }

            return $keys;
        }

        $cursor = $start->copy()->startOfMonth();
        $last = $end->copy()->startOfMonth();

        while ($cursor->lte($last)) {
            $key = $cursor->format('Y-m');
            $keys[$key] = ['label' => $cursor->translatedFormat('M Y')];
            $cursor->addMonth();
        }

        return $keys;
    }

    private function byKind(Collection $rows): array
    {
        $totals = [
            'tithes' => 0.0,
            'offering' => 0.0,
            'income' => 0.0,
            'expense' => 0.0,
        ];

        foreach ($rows as $row) {
            $totals[$row->kind] += (float) $row->amount;
        }

        return collect($totals)
            ->map(fn (float $amount, string $kind) => [
                'kind' => $kind,
                'amount' => round($amount, 2),
            ])
            ->filter(fn (array $item) => $item['amount'] > 0)
            ->values()
            ->all();
    }

    private function byCategory(Collection $rows): array
    {
        $grouped = [];

        foreach ($rows as $row) {
            $name = $row->category?->name ?? ucfirst($row->kind);
            $key = $row->category_id ?? $row->kind;

            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'category_id' => $row->category_id,
                    'name' => $name,
                    'group' => $row->category?->group ?? 'expense',
                    'kind' => $row->kind,
                    'amount' => 0.0,
                    'fixed_amount' => 0.0,
                ];
            }

            $grouped[$key]['amount'] += (float) $row->amount;
        }

        return $grouped;
    }

    /**
     * @param  array<string, array<string, mixed>>  $actualGrouped
     * @param  array<int, array<string, mixed>>  $fixedByCategory
     * @return array<int, array<string, mixed>>
     */
    private function mergeCategoryBreakdown(Collection $rows, array $fixedByCategory): array
    {
        $grouped = $this->byCategory($rows);

        foreach ($fixedByCategory as $fixed) {
            $key = $fixed['category_id'] ?? 'uncategorized';

            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'category_id' => $fixed['category_id'],
                    'name' => $fixed['name'],
                    'group' => $fixed['group'] ?? 'expense',
                    'kind' => 'expense',
                    'amount' => 0.0,
                    'fixed_amount' => 0.0,
                ];
            }

            $grouped[$key]['fixed_amount'] = (float) $fixed['amount'];
        }

        return collect($grouped)
            ->map(function (array $item) {
                $item['amount'] = round($item['amount'], 2);
                $item['fixed_amount'] = round($item['fixed_amount'], 2);
                $item['total_amount'] = round($item['amount'] + $item['fixed_amount'], 2);

                return $item;
            })
            ->sortByDesc('total_amount')
            ->values()
            ->take(8)
            ->all();
    }
}
