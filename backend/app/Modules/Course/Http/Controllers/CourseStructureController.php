<?php

namespace App\Modules\Course\Http\Controllers;

use App\Modules\Audit\Services\AccessLogService;
use App\Modules\Audit\Support\AccessLogAction;
use App\Modules\Course\Http\Requests\StoreCourseStructureRequest;
use App\Modules\Course\Services\CourseStructureCalculator;
use App\Modules\Course\Services\CourseStructureProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class CourseStructureController extends Controller
{
    public function __construct(
        private readonly CourseStructureCalculator $calculator,
        private readonly CourseStructureProvisioner $provisioner,
        private readonly AccessLogService $accessLog,
    ) {}

    public function preview(StoreCourseStructureRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->calculator->calculate($request->validated()),
        ]);
    }

    public function store(StoreCourseStructureRequest $request): JsonResponse
    {
        $this->ensureAcademicTables();

        $tenantId = app('current.tenant_id') ?? $request->user()->tenant_id;
        app()->instance('current.tenant_id', $tenantId);

        $result = $this->provisioner->provision(
            $request->validated(),
            $request->user(),
            $tenantId
        );

        $course = $result['course'];
        $course->load(['courseSubjects']);
        $plan = $result['plan'];

        $this->accessLog->recordDomain(
            AccessLogAction::COURSE_STRUCTURE_CREATED,
            $request,
            [
                'entity' => 'course',
                'course_id' => $course->id,
                'title' => $course->title,
                'subjects_count' => $plan['subjects_count'] ?? count($plan['subjects'] ?? []),
                'classes_count' => $plan['total_classes'] ?? $course->total_classes_planned,
            ],
            statusCode: 201,
        );

        return response()->json([
            'data' => $course,
            'structure' => $result['plan'],
            'message' => 'Curso creado con materias y clases generadas.',
        ], 201);
    }

    private function ensureAcademicTables(): void
    {
        if (! Schema::hasTable('course_subjects')) {
            throw ValidationException::withMessages([
                'migration' => ['Faltan tablas académicas. Ejecuta: php artisan migrate --force'],
            ]);
        }
    }
}
