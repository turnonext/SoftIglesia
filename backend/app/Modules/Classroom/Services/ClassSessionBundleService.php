<?php

namespace App\Modules\Classroom\Services;

use App\Modules\Auth\Models\User;
use App\Modules\Classroom\Models\ClassSession;
use App\Modules\Course\Models\Enrollment;
use App\Modules\File\Models\ContentFileLink;
use App\Modules\User\Models\Avatar;
use App\Modules\User\Models\UserProfile;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ClassSessionBundleService
{
    private const JOIN_MINUTES_BEFORE = 5;

    public function __construct(
        private readonly ClassMeetingLinkService $meetingLinks,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(ClassSession $session, User $viewer): array
    {
        $session->loadMissing([
            'course:id,title,slug,status,instructor_user_id',
            'courseSubject:id,course_id,name',
        ]);

        $access = $this->resolveAccess($session, $viewer);
        $joinWindow = $this->resolveJoinWindow($session);
        $staffBypass = in_array($access['role'], ['admin', 'instructor'], true);
        $canJoinNow = $staffBypass
            || ($access['can_join_live'] && $joinWindow['can_join_now']);

        $access['can_join_live_now'] = $canJoinNow;
        $access['join_window'] = $joinWindow;

        $instructor = $this->resolveInstructor($session->instructor_user_id);

        $meeting = null;
        if ($access['can_join_live'] && $canJoinNow) {
            $meeting = $this->meetingLinks->resolve($session);
        } elseif ($access['can_join_live']) {
            $meeting = [
                'join_url' => null,
                'meeting_id' => null,
                'provider' => $session->provider ?? 'zoom',
                'is_dynamic' => false,
                'locked' => true,
            ];
        }

        return [
            'session' => [
                'id' => $session->id,
                'title' => $session->title,
                'status' => $session->status,
                'provider' => $session->provider,
                'starts_at' => $session->starts_at?->toIso8601String(),
                'ends_at' => $session->ends_at?->toIso8601String(),
                'duration_minutes' => $session->duration_minutes,
                'session_number' => $session->session_number,
                'course_id' => $session->course_id,
                'course_subject_id' => $session->course_subject_id,
            ],
            'course' => $session->course ? [
                'id' => $session->course->id,
                'title' => $session->course->title,
                'slug' => $session->course->slug,
                'status' => $session->course->status,
            ] : null,
            'subject' => $session->courseSubject ? [
                'id' => $session->courseSubject->id,
                'name' => $session->courseSubject->name,
            ] : null,
            'instructor' => $instructor,
            'meeting' => $meeting,
            'documents' => $access['can_view_materials']
                ? $this->resolveDocuments($session)
                : [],
            'access' => $access,
        ];
    }

    /**
     * @return array{
     *   can_join_now: bool,
     *   join_opens_at: string|null,
     *   join_closes_at: string|null,
     *   status: string
     * }
     */
    private function resolveJoinWindow(ClassSession $session): array
    {
        $startsAt = $session->starts_at;
        if (! $startsAt) {
            return [
                'can_join_now' => false,
                'join_opens_at' => null,
                'join_closes_at' => null,
                'status' => 'unknown',
            ];
        }

        $opensAt = $startsAt->copy()->subMinutes(self::JOIN_MINUTES_BEFORE);
        $closesAt = $session->ends_at
            ?? $startsAt->copy()->addMinutes($session->duration_minutes ?? 90);

        $now = Carbon::now();

        if ($now->lt($opensAt)) {
            $status = 'too_early';
        } elseif ($now->gt($closesAt)) {
            $status = 'ended';
        } else {
            $status = 'open';
        }

        return [
            'can_join_now' => $status === 'open',
            'join_opens_at' => $opensAt->toIso8601String(),
            'join_closes_at' => $closesAt->toIso8601String(),
            'status' => $status,
        ];
    }

    /**
     * @return array{can_view: bool, can_join_live: bool, can_view_materials: bool, role: string}
     */
    private function resolveAccess(ClassSession $session, User $viewer): array
    {
        $role = $viewer->role;
        $isStaff = in_array($role, ['admin', 'instructor'], true);
        $isCourseInstructor = $session->course?->instructor_user_id === $viewer->id;
        $isClassInstructor = $session->instructor_user_id === $viewer->id;

        if ($role === 'admin' || $isCourseInstructor || $isClassInstructor) {
            return [
                'can_view' => true,
                'can_join_live' => true,
                'can_view_materials' => true,
                'role' => $role,
            ];
        }

        if ($role === 'instructor') {
            abort(403, 'No tienes acceso a esta clase.');
        }

        $enrolled = Enrollment::query()
            ->where('course_id', $session->course_id)
            ->where('student_user_id', $viewer->id)
            ->where('status', 'active')
            ->exists();

        abort_unless($enrolled, 403, 'Debes estar inscripto en el curso para ver esta clase.');

        return [
            'can_view' => true,
            'can_join_live' => true,
            'can_view_materials' => true,
            'role' => 'student',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveInstructor(?string $userId): ?array
    {
        if (! $userId) {
            return null;
        }

        $user = User::query()->find($userId);
        if (! $user) {
            return null;
        }

        $profile = UserProfile::query()->where('user_id', $userId)->first();
        $avatar = Avatar::query()->where('user_id', $userId)->first();

        $firstName = $profile?->first_name ?? '';
        $lastName = $profile?->last_name ?? '';
        $displayName = trim("{$firstName} {$lastName}") ?: $user->email;

        return [
            'id' => $user->id,
            'email' => $user->email,
            'display_name' => $displayName,
            'first_name' => $profile?->first_name,
            'last_name' => $profile?->last_name,
            'bio' => $profile?->bio,
            'has_avatar' => $avatar && Storage::disk($avatar->disk)->exists($avatar->path),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resolveDocuments(ClassSession $session): array
    {
        if (! Schema::hasTable('content_file_links')) {
            return [];
        }

        $baseUrl = rtrim(config('app.url'), '/').'/api/v1/files';

        $links = ContentFileLink::query()
            ->where('tenant_id', $session->tenant_id)
            ->where(function ($q) use ($session) {
                $q->where('class_id', $session->id)
                    ->orWhere(function ($q2) use ($session) {
                        $q2->where('course_subject_id', $session->course_subject_id)
                            ->whereNull('class_id');
                    })
                    ->orWhere(function ($q2) use ($session) {
                        $q2->where('course_id', $session->course_id)
                            ->whereNull('course_subject_id')
                            ->whereNull('class_id');
                    });
            })
            ->with('file:id,original_name,mime_type,size_bytes')
            ->orderByRaw('CASE WHEN class_id IS NOT NULL THEN 0 WHEN course_subject_id IS NOT NULL THEN 1 ELSE 2 END')
            ->orderBy('created_at')
            ->get();

        return $links->map(function (ContentFileLink $link) use ($baseUrl) {
            $scope = 'course';
            if ($link->class_id) {
                $scope = 'class';
            } elseif ($link->course_subject_id) {
                $scope = 'subject';
            }

            return [
                'id' => $link->id,
                'label' => $link->label ?? $link->file?->original_name,
                'scope' => $scope,
                'file' => $link->file ? [
                    'id' => $link->file->id,
                    'original_name' => $link->file->original_name,
                    'mime_type' => $link->file->mime_type,
                    'size_bytes' => $link->file->size_bytes,
                    'download_url' => "{$baseUrl}/{$link->file->id}/download",
                ] : null,
            ];
        })->filter(fn ($d) => $d['file'] !== null)->values()->all();
    }
}
