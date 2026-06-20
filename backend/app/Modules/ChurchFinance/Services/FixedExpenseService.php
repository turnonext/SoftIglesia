<?php

namespace App\Modules\ChurchFinance\Services;

use App\Modules\ChurchFinance\Models\FinanceFixedExpense;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FixedExpenseService
{
    public function monthlyEquivalent(FinanceFixedExpense $item): float
    {
        $amount = (float) $item->amount;

        return match ($item->frequency) {
            'weekly' => $amount * 4.33,
            'yearly' => $amount / 12,
            default => $amount,
        };
    }

    public function periodEquivalent(FinanceFixedExpense $item, Carbon $start, Carbon $end): float
    {
        if (! $item->is_active) {
            return 0.0;
        }

        $days = max(1, $start->diffInDays($end) + 1);
        $monthly = $this->monthlyEquivalent($item);

        return ($monthly / 30) * $days;
    }

    public function activeForCurrency(string $currency): Collection
    {
        return FinanceFixedExpense::query()
            ->with(['category:id,group,name,type'])
            ->where('currency', $currency)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function allForCurrency(string $currency): Collection
    {
        return FinanceFixedExpense::query()
            ->with(['category:id,group,name,type'])
            ->where('currency', $currency)
            ->orderBy('name')
            ->get();
    }

    public function monthlyTotal(string $currency): float
    {
        return round(
            $this->activeForCurrency($currency)->sum(fn (FinanceFixedExpense $item) => $this->monthlyEquivalent($item)),
            2
        );
    }

    public function periodTotal(string $currency, Carbon $start, Carbon $end): float
    {
        return round(
            $this->activeForCurrency($currency)->sum(
                fn (FinanceFixedExpense $item) => $this->periodEquivalent($item, $start, $end)
            ),
            2
        );
    }

    /**
     * @return array<int, array{category_id: string|null, name: string, amount: float}>
     */
    public function byCategory(string $currency): array
    {
        $grouped = [];

        foreach ($this->activeForCurrency($currency) as $item) {
            $key = $item->category_id ?? 'uncategorized';
            $name = $item->category?->name ?? 'Sin categoría';

            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'category_id' => $item->category_id,
                    'name' => $name,
                    'group' => $item->category?->group ?? 'expense',
                    'amount' => 0.0,
                ];
            }

            $grouped[$key]['amount'] += $this->monthlyEquivalent($item);
        }

        return collect($grouped)
            ->map(function (array $item) {
                $item['amount'] = round($item['amount'], 2);

                return $item;
            })
            ->sortByDesc('amount')
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(string $currency, ?Carbon $start = null, ?Carbon $end = null): array
    {
        $items = $this->allForCurrency($currency);
        $monthlyTotal = $this->monthlyTotal($currency);
        $periodTotal = $start && $end ? $this->periodTotal($currency, $start, $end) : $monthlyTotal;

        return [
            'currency' => $currency,
            'monthly_total' => $monthlyTotal,
            'period_total' => round($periodTotal, 2),
            'active_count' => $items->where('is_active', true)->count(),
            'by_category' => $this->byCategory($currency),
        ];
    }
}
