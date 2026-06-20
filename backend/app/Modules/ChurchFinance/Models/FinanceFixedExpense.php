<?php

namespace App\Modules\ChurchFinance\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceFixedExpense extends Model
{
    use BelongsToTenant, HasUlid;

    protected $table = 'church_finance_fixed_expenses';

    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'amount',
        'currency',
        'frequency',
        'due_day',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_day' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'category_id');
    }
}
