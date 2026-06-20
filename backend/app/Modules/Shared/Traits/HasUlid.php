<?php

namespace App\Modules\Shared\Traits;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

trait HasUlid
{
    use HasUlids;

    public function uniqueIds(): array
    {
        return ['id'];
    }
}
