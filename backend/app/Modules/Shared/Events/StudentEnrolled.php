<?php

namespace App\Modules\Shared\Events;

use App\Modules\Course\Models\Enrollment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentEnrolled
{
    use Dispatchable, SerializesModels;

    public function __construct(public Enrollment $enrollment) {}
}
