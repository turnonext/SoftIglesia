<?php

namespace App\Modules\Certificate\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;

class CertificateSignature extends Model
{
    use BelongsToTenant, HasUlid;

    protected $fillable = [
        'tenant_id',
        'slot',
        'enabled',
        'name',
        'title',
        'image_path',
    ];

    protected function casts(): array
    {
        return [
            'slot' => 'integer',
            'enabled' => 'boolean',
        ];
    }
}
