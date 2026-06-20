<?php

namespace App\Modules\ChurchCampuses\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChurchCampus extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'church_campuses';

    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'address_line',
        'city',
        'state',
        'country',
        'phone',
        'email',
        'leader_name',
        'status',
        'is_headquarters',
        'member_count',
        'group_count',
        'notes',
        'metrics',
    ];

    protected function casts(): array
    {
        return [
            'is_headquarters' => 'boolean',
            'member_count' => 'integer',
            'group_count' => 'integer',
            'metrics' => 'array',
        ];
    }
}
