<?php

namespace App\Modules\User\Models;

use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;

class Avatar extends Model
{
    use HasUlid;

    protected $fillable = [
        'user_id',
        'disk',
        'path',
        'mime_type',
        'size_bytes',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }
}
