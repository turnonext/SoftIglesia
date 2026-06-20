<?php

namespace App\Modules\User\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserProfile extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'first_name',
        'last_name',
        'phone',
        'bio',
        'locale',
        'timezone',
    ];
}
