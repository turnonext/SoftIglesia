<?php

namespace App\Providers;

use App\Modules\Shared\Providers\SharedServiceProvider;
use App\Modules\Shared\Providers\TenantApiServiceProvider;
use App\Modules\Academic\Providers\AcademicServiceProvider;
use App\Modules\Analytics\Providers\AnalyticsServiceProvider;
use App\Modules\Audit\Providers\AuditServiceProvider;
use App\Modules\Attendance\Providers\AttendanceServiceProvider;
use App\Modules\Auth\Providers\AuthServiceProvider;
use App\Modules\Certificate\Providers\CertificateServiceProvider;
use App\Modules\ChurchCampuses\Providers\ChurchCampusesServiceProvider;
use App\Modules\ChurchFinance\Providers\ChurchFinanceServiceProvider;
use App\Modules\ChurchMinistries\Providers\ChurchMinistriesServiceProvider;
use App\Modules\ChurchSeatEvents\Providers\ChurchSeatEventsServiceProvider;
use App\Modules\ChurchSpaces\Providers\ChurchSpacesServiceProvider;
use App\Modules\ChurchGatherings\Providers\ChurchGatheringsServiceProvider;
use App\Modules\ChurchGroups\Providers\ChurchGroupsServiceProvider;
use App\Modules\ChurchPeople\Providers\ChurchPeopleServiceProvider;
use App\Modules\Classroom\Providers\ClassroomServiceProvider;
use App\Modules\Course\Providers\CourseServiceProvider;
use App\Modules\File\Providers\FileServiceProvider;
use App\Modules\Integrations\Providers\IntegrationsServiceProvider;
use App\Modules\Notification\Providers\NotificationServiceProvider;
use App\Modules\Platform\Providers\PlatformServiceProvider;
use App\Modules\User\Providers\UserServiceProvider;
use Illuminate\Support\ServiceProvider;

class ModulesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $providers = [
            SharedServiceProvider::class,
            TenantApiServiceProvider::class,
            AuthServiceProvider::class,
            UserServiceProvider::class,
            CourseServiceProvider::class,
            ClassroomServiceProvider::class,
            AttendanceServiceProvider::class,
            FileServiceProvider::class,
            IntegrationsServiceProvider::class,
            CertificateServiceProvider::class,
            ChurchPeopleServiceProvider::class,
            ChurchGroupsServiceProvider::class,
            ChurchGatheringsServiceProvider::class,
            ChurchFinanceServiceProvider::class,
            ChurchCampusesServiceProvider::class,
            ChurchMinistriesServiceProvider::class,
            ChurchSpacesServiceProvider::class,
            ChurchSeatEventsServiceProvider::class,
            NotificationServiceProvider::class,
            AnalyticsServiceProvider::class,
            AuditServiceProvider::class,
            AcademicServiceProvider::class,
            PlatformServiceProvider::class,
        ];

        foreach ($providers as $provider) {
            $this->app->register($provider);
        }
    }
}
