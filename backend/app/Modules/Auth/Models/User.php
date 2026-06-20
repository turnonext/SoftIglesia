<?php

namespace App\Modules\Auth\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use App\Modules\User\Models\UserProfile;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use BelongsToTenant, HasUlid, Notifiable, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'email',
        'password',
        'role',
        'is_active',
        'mfa_enabled',
        'email_verified_at',
    ];

    protected $hidden = ['password', 'mfa_secret'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'mfa_enabled' => 'boolean',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'tenant_id' => $this->tenant_id,
            'role' => $this->role,
            'email' => $this->email,
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class, 'user_id');
    }
}
