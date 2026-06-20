<?php

namespace App\Providers;

use App\Modules\Shared\Events\CoursePublished;
use App\Modules\Shared\Events\StudentEnrolled;
use App\Modules\Shared\Listeners\WriteToOutbox;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        CoursePublished::class => [WriteToOutbox::class],
        StudentEnrolled::class => [WriteToOutbox::class],
    ];
}
