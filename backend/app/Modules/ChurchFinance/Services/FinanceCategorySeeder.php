<?php

namespace App\Modules\ChurchFinance\Services;

use App\Modules\ChurchFinance\Models\FinanceCategory;
use App\Modules\ChurchFinance\Support\FinanceCategoryCatalog;

class FinanceCategorySeeder
{
    public function seedDefaults(): int
    {
        $created = 0;

        foreach (FinanceCategoryCatalog::defaults() as $group => $categories) {
            foreach ($categories as $category) {
                $exists = FinanceCategory::query()
                    ->where('group', $group)
                    ->where('name', $category['name'])
                    ->exists();

                if ($exists) {
                    continue;
                }

                FinanceCategory::query()->create([
                    'group' => $group,
                    'name' => $category['name'],
                    'type' => $category['type'],
                    'is_system' => true,
                    'is_active' => true,
                ]);
                $created++;
            }
        }

        return $created;
    }
}
