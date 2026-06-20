<?php

namespace App\Modules\Audit\Support;

final class AccessLogAction
{
    public const LOGIN = 'login';

    public const REGISTER = 'register';

    public const PASSWORD_FORGOT = 'password_forgot';

    public const PASSWORD_RESET = 'password_reset';

    public const COURSE_CREATED = 'course_created';

    public const COURSE_STRUCTURE_CREATED = 'course_structure_created';

    public const COURSE_UPDATED = 'course_updated';

    public const USER_ASSIGNED_INSTRUCTOR = 'user_assigned_instructor';

    public const USER_UPDATED = 'user_updated';

    public const EMAIL_TEMPLATE_UPDATED = 'email_template_updated';

    public const PROFILE_UPDATED = 'profile_updated';

    /**
     * @return array<int, string>
     */
    public static function accessActions(): array
    {
        return [
            self::LOGIN,
            self::REGISTER,
            self::PASSWORD_FORGOT,
            self::PASSWORD_RESET,
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function systemActions(): array
    {
        return [
            self::COURSE_CREATED,
            self::COURSE_STRUCTURE_CREATED,
            self::COURSE_UPDATED,
            self::USER_ASSIGNED_INSTRUCTOR,
            self::USER_UPDATED,
            self::EMAIL_TEMPLATE_UPDATED,
            self::PROFILE_UPDATED,
        ];
    }

    public static function categoryFor(string $action): string
    {
        return in_array($action, self::accessActions(), true) ? 'access' : 'system';
    }
}
