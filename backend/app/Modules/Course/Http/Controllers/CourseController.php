<?php

namespace App\Modules\Course\Http\Controllers;

use App\Modules\Audit\Services\AccessLogService;
use App\Modules\Audit\Support\AccessLogAction;
use App\Modules\Course\Http\Requests\StoreCourseRequest;
use App\Modules\Course\Models\Course;
use App\Modules\Shared\Events\CoursePublished;
use App\Modules\Shared\Events\StudentEnrolled;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function __construct(
        private readonly AccessLogService $accessLog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        $query = Course::query()
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->orderByRaw('CASE WHEN start_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('start_date')
            ->orderBy('created_at');

        if (Schema::hasTable('course_subjects')) {
            $query->with(['courseSubjects:id,course_id,name,classes_count']);
        }

        $perPage = min(50, max(5, (int) $request->query('per_page', 20)));
        $courses = $query->paginate($perPage);

        return response()->json($courses);
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $course = Course::query()->create([
            ...$request->validated(),
            'tenant_id' => app('current.tenant_id'),
            'instructor_user_id' => $request->user()->id,
            'slug' => Str::slug($request->validated('title')).'-'.Str::lower(Str::random(4)),
            'status' => 'draft',
        ]);

        $this->accessLog->recordDomain(
            AccessLogAction::COURSE_CREATED,
            $request,
            [
                'entity' => 'course',
                'course_id' => $course->id,
                'title' => $course->title,
            ],
            statusCode: 201,
        );

        return response()->json(['data' => $course], 201);
    }

    public function show(Course $course): JsonResponse
    {
        $course->load(['modules']);

        if (Schema::hasTable('course_subjects')) {
            $course->load(['courseSubjects']);
        }

        if (Schema::hasTable('classes')) {
            $course->load([
                'classSessions' => fn ($q) => $q->with('courseSubject:id,name')->orderBy('starts_at'),
            ]);
        }

        return response()->json(['data' => $course]);
    }

    public function publish(Course $course): JsonResponse
    {
        $this->authorizeInstructor($course);

        $course->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->accessLog->recordDomain(
            AccessLogAction::COURSE_UPDATED,
            request(),
            [
                'entity' => 'course',
                'course_id' => $course->id,
                'title' => $course->title,
                'changes' => ['status' => ['from' => 'draft', 'to' => 'published']],
            ],
        );

        event(new CoursePublished($course));

        return response()->json(['data' => $course]);
    }

    public function unpublish(Course $course): JsonResponse
    {
        $this->authorizeInstructor($course);

        $course->update([
            'status' => 'draft',
            'published_at' => null,
        ]);

        $this->accessLog->recordDomain(
            AccessLogAction::COURSE_UPDATED,
            request(),
            [
                'entity' => 'course',
                'course_id' => $course->id,
                'title' => $course->title,
                'changes' => ['status' => ['from' => 'published', 'to' => 'draft']],
            ],
        );

        return response()->json(['data' => $course->fresh()]);
    }

    public function enroll(Course $course, Request $request): JsonResponse
    {
        $enrollment = $course->enrollments()->create([
            'tenant_id' => $course->tenant_id,
            'student_user_id' => $request->user()->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        event(new StudentEnrolled($enrollment));

        return response()->json(['data' => $enrollment], 201);
    }

    private function authorizeInstructor(Course $course): void
    {
        $user = request()->user();
        abort_unless(
            $course->instructor_user_id === $user->id || $user->role === 'admin',
            403
        );
    }
}
