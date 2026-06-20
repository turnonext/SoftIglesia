<?php

namespace App\Modules\ChurchGatherings\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GatheringAttendance extends Model
{
    use BelongsToTenant, HasUlid;

    protected $table = 'church_gathering_attendances';

    protected $fillable = [
        'tenant_id',
        'church_gathering_id',
        'member_id',
        'guest_name',
        'method',
        'checked_in_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function gathering(): BelongsTo
    {
        return $this->belongsTo(ChurchGathering::class, 'church_gathering_id');
    }
}
