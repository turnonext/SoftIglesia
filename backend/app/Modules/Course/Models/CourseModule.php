<?php

namespace App\Modules\Course\Models;

use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseModule extends Model
{
    use HasUlid, SoftDeletes;

    protected $table = 'course_modules';

    protected $fillable = ['course_id', 'title', 'sort_order'];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
