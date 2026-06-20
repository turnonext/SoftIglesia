<?php

namespace App\Modules\Audit\Models;

use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessLog extends Model
{
    use HasUlid;

    public $timestamps = false;

    protected $table = 'log_acceso';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'email',
        'action',
        'method',
        'path',
        'ip_address',
        'user_agent',
        'status_code',
        'success',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'success' => 'boolean',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Auth\Models\User::class, 'user_id');
    }
}
