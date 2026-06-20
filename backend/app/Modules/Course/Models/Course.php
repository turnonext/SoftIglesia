<?php

namespace App\Modules\Course\Models;

use App\Modules\Classroom\Models\ClassSession;
use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'subject_id',
        'instructor_user_id',
        'title',
        'slug',
        'description',
        'status',
        'capacity',
        'published_at',
        'start_date',
        'end_date',
        'duration_months',
        'duration_unit',
        'duration_weeks',
        'schedule_days',
        'schedule_day_times',
        'class_start_time',
        'class_end_time',
        'minutes_per_class',
        'subjects_count',
        'classes_per_subject',
        'total_classes_planned',
        'generation_mode',
        'class_distribution',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'capacity' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'duration_months' => 'integer',
            'duration_weeks' => 'integer',
            'schedule_days' => 'array',
            'schedule_day_times' => 'array',
            'minutes_per_class' => 'integer',
            'subjects_count' => 'integer',
            'classes_per_subject' => 'integer',
            'total_classes_planned' => 'integer',
        ];
    }

    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class, 'course_id');
    }

    public function courseSubjects(): HasMany
    {
        return $this->hasMany(CourseSubject::class, 'course_id')->orderBy('sort_order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'course_id');
    }

    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class, 'course_id')->orderBy('starts_at');
    }
}
