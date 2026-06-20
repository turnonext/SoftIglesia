<?php

namespace App\Modules\Shared\Models;

use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasUlid, SoftDeletes;

    protected $fillable = ['name', 'slug', 'domain', 'plan', 'settings', 'is_active'];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
