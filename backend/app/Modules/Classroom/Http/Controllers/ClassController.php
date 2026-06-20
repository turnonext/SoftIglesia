<?php

namespace App\Modules\Classroom\Http\Controllers;

use App\Modules\Classroom\Models\ClassSession;
use App\Modules\Classroom\Services\ClassSessionBundleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ClassController extends Controller
{
    public function __construct(
        private readonly ClassSessionBundleService $bundleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = ClassSession::query()
            ->with([
                'courseSubject:id,name,course_id',
                'course:id,title,status',
            ])
            ->when($request->query('course_id'), fn ($q, $id) => $q->where('course_id', $id))
            ->when($request->query('course_subject_id'), fn ($q, $id) => $q->where('course_subject_id', $id))
            ->when($request->query('from'), fn ($q, $from) => $q->where('starts_at', '>=', $from))
            ->when($request->query('to'), fn ($q, $to) => $q->where('starts_at', '<=', $to))
            ->orderBy('starts_at');

        if ($user->role === 'student') {
            $courseIds = \App\Modules\Course\Models\Enrollment::query()
                ->where('student_user_id', $user->id)
                ->where('status', 'active')
                ->pluck('course_id');
            $query->whereIn('course_id', $courseIds);
        } elseif ($user->role === 'instructor') {
            $query->where('instructor_user_id', $user->id);
        }

        $perPage = min(100, max(5, (int) $request->query('per_page', 20)));

        return response()->json($query->paginate($perPage));
    }

    public function show(ClassSession $classSession, Request $request): JsonResponse
    {
        abort_unless($classSession->tenant_id === $request->user()->tenant_id, 404);

        return response()->json([
            'data' => $this->bundleService->build($classSession, $request->user()),
        ]);
    }
}
