<?php

namespace App\Modules\Classroom\Models;

use App\Modules\Auth\Models\User;
use App\Modules\Course\Models\Course;
use App\Modules\Course\Models\CourseSubject;
use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassSession extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'tenant_id',
        'course_id',
        'course_subject_id',
        'instructor_user_id',
        'title',
        'session_number',
        'provider',
        'status',
        'starts_at',
        'ends_at',
        'duration_minutes',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'duration_minutes' => 'integer',
            'session_number' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function courseSubject(): BelongsTo
    {
        return $this->belongsTo(CourseSubject::class, 'course_subject_id');
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_user_id');
    }

    public function meetLink(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ClassMeetLink::class, 'class_id');
    }
}
