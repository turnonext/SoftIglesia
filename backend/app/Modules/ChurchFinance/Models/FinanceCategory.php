<?php

namespace App\Modules\ChurchFinance\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinanceCategory extends Model
{
    use BelongsToTenant, HasUlid;

    protected $table = 'church_finance_categories';

    protected $fillable = [
        'tenant_id',
        'group',
        'name',
        'type',
        'is_system',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'category_id');
    }

    public function fixedExpenses(): HasMany
    {
        return $this->hasMany(FinanceFixedExpense::class, 'category_id');
    }
}
