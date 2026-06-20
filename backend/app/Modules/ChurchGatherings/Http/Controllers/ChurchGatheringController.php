<?php

namespace App\Modules\ChurchGatherings\Http\Controllers;

use App\Modules\ChurchGatherings\Http\Requests\CheckinGatheringRequest;
use App\Modules\ChurchGatherings\Http\Requests\StoreChurchGatheringRequest;
use App\Modules\ChurchGatherings\Http\Requests\UpdateChurchGatheringRequest;
use App\Modules\ChurchGatherings\Models\ChurchGathering;
use App\Modules\ChurchGatherings\Models\GatheringAttendance;
use App\Modules\ChurchGatherings\Services\GatheringRecurrenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ChurchGatheringController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $type = $request->query('type');
        $range = $request->query('range', 'all');

        $orderAsc = $request->query('from') !== null;

        $query = ChurchGathering::query()
            ->when(in_array($status, ['scheduled', 'live', 'completed', 'cancelled'], true), fn ($q) => $q->where('status', $status))
            ->when(in_array($type, ['service', 'event', 'cell_meeting', 'special'], true), fn ($q) => $q->where('type', $type))
            ->when($request->query('from'), fn ($q, $from) => $q->where('starts_at', '>=', $from))
            ->when($request->query('to'), fn ($q, $to) => $q->where('starts_at', '<=', $to))
            ->when($range === 'upcoming', fn ($q) => $q->where('starts_at', '>=', now())->where('status', '!=', 'cancelled'))
            ->when($range === 'past', fn ($q) => $q->where('starts_at', '<', now()))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('starts_at', $orderAsc ? 'asc' : 'desc');

        $perPage = min(100, max(10, (int) $request->query('per_page', 20)));
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function store(
        StoreChurchGatheringRequest $request,
        GatheringRecurrenceService $recurrenceService
    ): JsonResponse {
        $payload = $request->validated();
        $recurrence = $payload['recurrence'] ?? null;
        unset($payload['recurrence']);

        if (! empty($recurrence['enabled'])) {
            $result = $recurrenceService->createWeeklySeries($payload, $recurrence);

            return response()->json([
                'data' => $result['first'],
                'created_count' => $result['count'],
                'series_id' => $result['series_id'],
                'message' => "Se programaron {$result['count']} reuniones recurrentes.",
            ], 201);
        }

        $payload['type'] = $payload['type'] ?? 'service';
        $payload['status'] = $payload['status'] ?? 'scheduled';
        $checkinEnabled = $payload['checkin_enabled'] ?? true;
        $payload['checkin_enabled'] = $checkinEnabled;

        if ($checkinEnabled) {
            $payload['checkin_token'] = ChurchGathering::generateCheckinToken();
        }

        $gathering = ChurchGathering::query()->create($payload);

        return response()->json(['data' => $gathering], 201);
    }

    public function show(ChurchGathering $churchGathering): JsonResponse
    {
        $churchGathering->loadCount('attendances');

        return response()->json(['data' => $churchGathering]);
    }

    public function update(UpdateChurchGatheringRequest $request, ChurchGathering $churchGathering): JsonResponse
    {
        $churchGathering->fill($request->validated());

        if ($churchGathering->checkin_enabled && empty($churchGathering->checkin_token)) {
            $churchGathering->checkin_token = ChurchGathering::generateCheckinToken();
        }

        if (! $churchGathering->checkin_enabled) {
            $churchGathering->checkin_token = null;
        }

        $churchGathering->save();

        return response()->json([
            'data' => $churchGathering->fresh(),
            'message' => 'Reunión actualizada.',
        ]);
    }

    public function checkin(CheckinGatheringRequest $request, ChurchGathering $churchGathering): JsonResponse
    {
        abort_unless($churchGathering->checkin_enabled, 422, 'El check-in no está habilitado para esta reunión.');

        $memberId = $request->validated('member_id');
        $guestName = $request->validated('guest_name');

        if ($memberId) {
            $exists = GatheringAttendance::query()
                ->where('church_gathering_id', $churchGathering->id)
                ->where('member_id', $memberId)
                ->exists();

            abort_if($exists, 422, 'Este miembro ya registró asistencia.');
        }

        $attendance = GatheringAttendance::query()->create([
            'church_gathering_id' => $churchGathering->id,
            'member_id' => $memberId,
            'guest_name' => $memberId ? null : $guestName,
            'method' => $request->validated('method') ?? 'manual',
            'checked_in_at' => now(),
        ]);

        $count = GatheringAttendance::query()
            ->where('church_gathering_id', $churchGathering->id)
            ->count();

        $churchGathering->update(['attendance_count' => $count]);

        return response()->json([
            'data' => $attendance,
            'attendance_count' => $count,
            'message' => 'Asistencia registrada.',
        ], 201);
    }

    public function regenerateCheckinToken(ChurchGathering $churchGathering): JsonResponse
    {
        abort_unless(in_array(request()->user()?->role, ['admin', 'instructor'], true), 403);

        $churchGathering->update([
            'checkin_token' => ChurchGathering::generateCheckinToken(),
            'checkin_enabled' => true,
        ]);

        return response()->json([
            'data' => $churchGathering->fresh(),
            'message' => 'Token de check-in renovado.',
        ]);
    }
}
