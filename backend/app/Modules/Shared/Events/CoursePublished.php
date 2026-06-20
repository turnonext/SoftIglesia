<?php

namespace App\Modules\Shared\Events;

use App\Modules\Course\Models\Course;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CoursePublished
{
    use Dispatchable, SerializesModels;

    public function __construct(public Course $course) {}
}
