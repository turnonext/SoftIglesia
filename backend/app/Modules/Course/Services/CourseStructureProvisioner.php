<?php

namespace App\Modules\Course\Services;

use App\Modules\Auth\Models\User;
use App\Modules\Classroom\Models\ClassSession;
use App\Modules\Course\Models\Course;
use App\Modules\Course\Models\CourseSubject;
use App\Modules\File\Models\ContentFileLink;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CourseStructureProvisioner
{
    public function __construct(
        private readonly CourseStructureCalculator $calculator,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{course: Course, plan: array<string, mixed>}
     */
    public function provision(array $input, User $user, string $tenantId): array
    {
        return DB::transaction(function () use ($input, $user, $tenantId) {
            $plan = $this->calculator->calculate($input);

            $course = Course::query()->create([
                'tenant_id' => $tenantId,
                'instructor_user_id' => $user->id,
                'title' => $input['title'],
                'slug' => Str::slug($input['title']).'-'.Str::lower(Str::random(4)),
                'description' => $input['description'] ?? null,
                'status' => 'draft',
                'capacity' => $input['capacity'] ?? null,
                'start_date' => $plan['start_date'],
                'end_date' => $plan['end_date'],
                'duration_months' => $plan['duration_months'],
                'duration_unit' => $plan['duration_unit'],
                'duration_weeks' => $plan['duration_weeks'],
                'schedule_days' => $plan['schedule_days'],
                'schedule_day_times' => $plan['schedule_day_times'] ?? null,
                'class_start_time' => $plan['class_start_time'],
                'class_end_time' => $plan['class_end_time'],
                'minutes_per_class' => $plan['minutes_per_class'],
                'subjects_count' => $plan['subjects_count'],
                'classes_per_subject' => $plan['classes_per_subject'],
                'total_classes_planned' => $plan['total_classes'],
                'generation_mode' => $plan['generation_mode'],
                'class_distribution' => $plan['class_distribution'],
            ]);

            $subjectModels = [];
            foreach ($plan['subjects'] as $subjectPlan) {
                $subjectModels[] = CourseSubject::query()->create([
                    'tenant_id' => $tenantId,
                    'course_id' => $course->id,
                    'name' => $subjectPlan['name'],
                    'sort_order' => $subjectPlan['sort_order'],
                    'classes_count' => $subjectPlan['classes_count'],
                    'minutes_per_class' => $plan['minutes_per_class'],
                ]);
            }

            $sessionGlobal = 0;
            foreach ($plan['subjects'] as $idx => $subjectPlan) {
                $subject = $subjectModels[$idx];
                $sessionNum = 0;
                $sessions = $subjectPlan['class_sessions'] ?? [];
                if ($sessions === [] && ! empty($subjectPlan['class_dates'])) {
                    foreach ($subjectPlan['class_dates'] as $date) {
                        $sessions[] = [
                            'date' => $date,
                            'start_time' => $plan['class_start_time'],
                            'end_time' => $plan['class_end_time'],
                        ];
                    }
                }

                foreach ($sessions as $session) {
                    $sessionNum++;
                    $sessionGlobal++;
                    $date = $session['date'];
                    $startsAt = Carbon::parse($date.' '.$session['start_time']);
                    $endsAt = Carbon::parse($date.' '.$session['end_time']);

                    ClassSession::query()->create([
                        'tenant_id' => $tenantId,
                        'course_id' => $course->id,
                        'course_subject_id' => $subject->id,
                        'instructor_user_id' => $user->id,
                        'title' => $subject->name.' — Clase '.$sessionNum,
                        'session_number' => $sessionNum,
                        'provider' => $input['class_provider'] ?? 'zoom',
                        'status' => 'scheduled',
                        'starts_at' => $startsAt,
                        'ends_at' => $endsAt,
                        'duration_minutes' => $plan['minutes_per_class'],
                    ]);
                }
            }

            $this->attachPendingFiles($input['file_links'] ?? [], $tenantId, $course, $subjectModels);

            $course->load(['courseSubjects']);

            return [
                'course' => $course,
                'plan' => $plan,
            ];
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $links
     * @param  array<int, CourseSubject>  $subjectModels
     */
    private function attachPendingFiles(array $links, string $tenantId, Course $course, array $subjectModels): void
    {
        foreach ($links as $link) {
            if (empty($link['file_id'])) {
                continue;
            }
            $subjectId = null;
            if (isset($link['subject_index']) && isset($subjectModels[$link['subject_index']])) {
                $subjectId = $subjectModels[$link['subject_index']]->id;
            }

            ContentFileLink::query()->create([
                'tenant_id' => $tenantId,
                'file_id' => $link['file_id'],
                'course_id' => ($link['scope'] ?? 'course') === 'course' ? $course->id : null,
                'course_subject_id' => ($link['scope'] ?? '') === 'subject' ? $subjectId : null,
                'class_id' => $link['class_id'] ?? null,
                'label' => $link['label'] ?? null,
            ]);
        }
    }
}
