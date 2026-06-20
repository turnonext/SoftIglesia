<?php

namespace App\Modules\ChurchGroups\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChurchGroup extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'church_groups';

    protected $fillable = [
        'tenant_id',
        'campus_id',
        'name',
        'description',
        'type',
        'status',
        'leader_name',
        'leader_phone',
        'leader_email',
        'leader_member_id',
        'co_leader_name',
        'co_leader_member_id',
        'meeting_day',
        'meeting_time',
        'address_line',
        'city',
        'latitude',
        'longitude',
        'member_count',
        'weekly_topic',
        'metrics',
    ];

    protected function casts(): array
    {
        return [
            'member_count' => 'integer',
            'latitude' => 'float',
            'longitude' => 'float',
            'metrics' => 'array',
        ];
    }
}
