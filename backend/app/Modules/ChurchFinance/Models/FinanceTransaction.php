<?php

namespace App\Modules\ChurchFinance\Models;

use App\Modules\ChurchCampuses\Models\ChurchCampus;
use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceTransaction extends Model
{
    use BelongsToTenant, HasUlid;

    protected $table = 'church_finance_transactions';

    protected $fillable = [
        'tenant_id',
        'campus_id',
        'category_id',
        'kind',
        'amount',
        'currency',
        'reference',
        'description',
        'donor_name',
        'occurred_on',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'occurred_on' => 'date',
            'metadata' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'category_id');
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(ChurchCampus::class, 'campus_id');
    }
}
