<?php

namespace App\Modules\Certificate\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;

class CertificateTemplate extends Model
{
    use BelongsToTenant, HasUlid;

    protected $fillable = [
        'tenant_id',
        'key',
        'name',
        'body_html',
        'available_variables',
        'signatures',
        'is_system',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'available_variables' => 'array',
            'signatures' => 'array',
            'is_system' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
