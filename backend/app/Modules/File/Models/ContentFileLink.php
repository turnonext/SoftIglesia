<?php

namespace App\Modules\File\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentFileLink extends Model
{
    use BelongsToTenant, HasUlid;

    protected $fillable = [
        'tenant_id',
        'file_id',
        'course_id',
        'course_subject_id',
        'class_id',
        'label',
    ];

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class);
    }
}
