<?php

namespace App\Modules\Integrations\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;

class TenantMeetingCredential extends Model
{
    use BelongsToTenant, HasUlid;

    protected $fillable = [
        'tenant_id',
        'provider',
        'credentials',
        'is_enabled',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }
}
