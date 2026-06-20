<?php

namespace App\Modules\ChurchPeople\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberTimelineEvent extends Model
{
    use BelongsToTenant, HasUlid;

    protected $fillable = [
        'tenant_id',
        'member_id',
        'type',
        'title',
        'description',
        'event_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'event_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
