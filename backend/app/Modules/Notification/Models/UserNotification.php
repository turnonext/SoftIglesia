<?php

namespace App\Modules\Notification\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    use BelongsToTenant, HasUlid;

    protected $table = 'notifications';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'channel',
        'type',
        'payload',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'read_at' => 'datetime',
        ];
    }
}
