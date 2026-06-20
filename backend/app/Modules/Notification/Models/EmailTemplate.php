<?php

namespace App\Modules\Notification\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use BelongsToTenant, HasUlid;

    protected $fillable = [
        'tenant_id',
        'key',
        'name',
        'subject',
        'body_html',
        'available_variables',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'available_variables' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
