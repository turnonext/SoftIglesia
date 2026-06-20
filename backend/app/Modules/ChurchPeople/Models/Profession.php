<?php

namespace App\Modules\ChurchPeople\Models;

use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profession extends Model
{
    use HasUlid;

    protected $fillable = [
        'name',
        'sort_order',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }
}
