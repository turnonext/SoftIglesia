<?php

namespace App\Modules\Classroom\Models;

use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassMeetLink extends Model
{
    use HasUlid;

    protected $table = 'zoom_meet_links';

    protected $fillable = [
        'class_id',
        'meeting_id',
        'join_url',
        'start_url',
        'password',
        'provider_meta',
    ];

    protected function casts(): array
    {
        return [
            'provider_meta' => 'array',
        ];
    }

    public function classSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class, 'class_id');
    }
}
