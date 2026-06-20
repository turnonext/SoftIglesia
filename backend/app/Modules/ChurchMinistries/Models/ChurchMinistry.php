<?php

namespace App\Modules\ChurchMinistries\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChurchMinistry extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'church_ministries';

    protected $fillable = [
        'tenant_id',
        'campus_id',
        'name',
        'description',
        'type',
        'leader_name',
        'leader_email',
        'leader_phone',
        'status',
        'member_count',
        'volunteer_count',
        'notes',
        'metrics',
    ];

    protected function casts(): array
    {
        return [
            'member_count' => 'integer',
            'volunteer_count' => 'integer',
            'metrics' => 'array',
        ];
    }
}
