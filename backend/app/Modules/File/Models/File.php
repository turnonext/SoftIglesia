<?php

namespace App\Modules\File\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class File extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'uploaded_by_user_id',
        'disk',
        'bucket',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'checksum',
        'visibility',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    public function links(): HasMany
    {
        return $this->hasMany(ContentFileLink::class, 'file_id');
    }
}
