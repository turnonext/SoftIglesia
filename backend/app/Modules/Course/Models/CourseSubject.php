<?php

namespace App\Modules\Course\Models;

use App\Modules\Classroom\Models\ClassSession;
use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseSubject extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'course_id',
        'name',
        'sort_order',
        'classes_count',
        'minutes_per_class',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'classes_count' => 'integer',
            'minutes_per_class' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class, 'course_subject_id');
    }
}
