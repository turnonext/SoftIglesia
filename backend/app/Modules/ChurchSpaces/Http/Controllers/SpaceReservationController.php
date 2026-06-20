<?php

namespace App\Modules\ChurchSpaces\Http\Controllers;

use App\Modules\ChurchSpaces\Http\Requests\StoreSpaceReservationRequest;
use App\Modules\ChurchSpaces\Http\Requests\UpdateSpaceReservationRequest;
use App\Modules\ChurchSpaces\Models\ChurchSpace;
use App\Modules\ChurchSpaces\Models\ChurchSpaceReservation;
use App\Modules\ChurchSpaces\Services\SpaceReservationRecurrenceService;
use App\Modules\ChurchSpaces\Services\SpaceReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class SpaceReservationController extends Controller
{
    public function __construct(
        private readonly SpaceReservationService $reservations,
        private readonly SpaceReservationRecurrenceService $recurrences,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $spaceId = $request->query('space_id');
        $from = $request->query('from');
        $to = $request->query('to');
        $mine = filter_var($request->query('mine', false), FILTER_VALIDATE_BOOLEAN);

        $query = ChurchSpaceReservation::query()
            ->with([
                'space:id,name,code,color,capacity',
                'user:id,email',
                'user.profile:user_id,first_name,last_name',
                'ministry:id,name',
            ])
            ->where(function ($q) {
                $q->whereNull('recurrence_weekday')
                    ->orWhereColumn('id', 'recurrence_series_id');
            })
            ->when(in_array($status, ['pending', 'confirmed', 'cancelled'], true), fn ($q) => $q->where('status', $status))
            ->when($spaceId, fn ($q) => $q->where('church_space_id', $spaceId))
            ->when($mine, fn ($q) => $q->where('user_id', $request->user()->id))
            ->when($from, fn ($q) => $q->where('ends_at', '>=', Carbon::parse($from)))
            ->when($to, fn ($q) => $q->where('starts_at', '<=', Carbon::parse($to)))
            ->orderByDesc('starts_at');

        $perPage = min(50, max(10, (int) $request->query('per_page', 20)));
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

    public function store(StoreSpaceReservationRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $recurrence = $payload['recurrence'] ?? null;
        unset($payload['recurrence']);

        $space = ChurchSpace::query()->findOrFail($payload['church_space_id']);

        if (! empty($recurrence['enabled'])) {
            $result = $this->recurrences->createFixedSchedule(
                $payload,
                $recurrence,
                $request->user(),
                $space
            );
            $reservation = $result['reservation'];

            return response()->json([
                'data' => $reservation->load(['space:id,name,code,color', 'user:id,email', 'user.profile:user_id,first_name,last_name', 'ministry:id,name']),
                'meta' => [
                    'series_id' => $result['series_id'],
                ],
                'message' => 'Reserva fija registrada.',
            ], 201);
        }

        $startsAt = Carbon::parse($payload['starts_at']);
        $endsAt = Carbon::parse($payload['ends_at']);
        $attendees = (int) ($payload['attendees_count'] ?? 1);

        $this->reservations->assertCanBook($space, $startsAt, $endsAt, $attendees);

        $reservation = ChurchSpaceReservation::query()->create([
            'church_space_id' => $space->id,
            'user_id' => $request->user()->id,
            'church_ministry_id' => $payload['church_ministry_id'],
            'title' => $payload['title'],
            'purpose' => $payload['purpose'] ?? null,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'attendees_count' => $attendees,
            'status' => $this->reservations->initialStatus($space),
            'notes' => $payload['notes'] ?? null,
        ]);

        return response()->json([
            'data' => $reservation->load(['space:id,name,code,color', 'user:id,email', 'user.profile:user_id,first_name,last_name', 'ministry:id,name']),
            'message' => $reservation->status === 'pending'
                ? 'Reserva enviada para aprobación.'
                : 'Reserva confirmada.',
        ], 201);
    }

    public function update(UpdateSpaceReservationRequest $request, ChurchSpaceReservation $churchSpaceReservation): JsonResponse
    {
        $user = $request->user();
        $isManager = in_array($user->role, ['admin', 'instructor'], true);

        if (! $isManager && $churchSpaceReservation->user_id !== $user->id) {
            abort(403);
        }

        $payload = $request->validated();

        if (! $isManager && isset($payload['status']) && $payload['status'] !== 'cancelled') {
            unset($payload['status']);
        }

        if (! $isManager && (isset($payload['starts_at']) || isset($payload['ends_at']))) {
            throw ValidationException::withMessages([
                'starts_at' => ['Solo administradores pueden reprogramar reservas. Cancelá y creá una nueva.'],
            ]);
        }

        $startsAt = isset($payload['starts_at'])
            ? Carbon::parse($payload['starts_at'])
            : $churchSpaceReservation->starts_at;
        $endsAt = isset($payload['ends_at'])
            ? Carbon::parse($payload['ends_at'])
            : $churchSpaceReservation->ends_at;
        $attendees = (int) ($payload['attendees_count'] ?? $churchSpaceReservation->attendees_count);

        if (isset($payload['starts_at']) || isset($payload['ends_at']) || isset($payload['attendees_count'])) {
            $space = $churchSpaceReservation->space;
            $this->reservations->assertCanBook(
                $space,
                $startsAt,
                $endsAt,
                $attendees,
                $churchSpaceReservation->id
            );
        }

        if (($payload['status'] ?? null) === 'cancelled') {
            $payload['cancelled_at'] = now();
            $payload['cancelled_by'] = $user->id;
        }

        $churchSpaceReservation->fill($payload);
        $churchSpaceReservation->save();

        return response()->json([
            'data' => $churchSpaceReservation->fresh()->load(['space:id,name,code,color', 'user:id,email', 'user.profile:user_id,first_name,last_name', 'ministry:id,name']),
            'message' => 'Reserva actualizada.',
        ]);
    }

    public function cancel(Request $request, ChurchSpaceReservation $churchSpaceReservation): JsonResponse
    {
        $user = $request->user();
        $isManager = in_array($user->role, ['admin', 'instructor'], true);

        if (! $isManager && $churchSpaceReservation->user_id !== $user->id) {
            abort(403);
        }

        if ($churchSpaceReservation->status === 'cancelled') {
            return response()->json(['data' => $churchSpaceReservation, 'message' => 'La reserva ya estaba cancelada.']);
        }

        if ($churchSpaceReservation->isFixedSchedule()) {
            $seriesId = $churchSpaceReservation->recurrence_series_id ?? $churchSpaceReservation->id;
            if (! $this->recurrences->cancelFixedSchedule($seriesId, $user, $isManager)) {
                throw ValidationException::withMessages([
                    'status' => ['No se encontró el horario fijo para cancelar.'],
                ]);
            }

            $reservation = ChurchSpaceReservation::query()->find($seriesId);

            return response()->json([
                'data' => $reservation?->fresh()->load(['space:id,name,code,color', 'user:id,email', 'user.profile:user_id,first_name,last_name', 'ministry:id,name']),
                'message' => 'Horario fijo cancelado.',
            ]);
        }

        $churchSpaceReservation->status = 'cancelled';
        $churchSpaceReservation->cancelled_at = now();
        $churchSpaceReservation->cancelled_by = $user->id;
        $churchSpaceReservation->save();

        return response()->json([
            'data' => $churchSpaceReservation->fresh(),
            'message' => 'Reserva cancelada.',
        ]);
    }

    public function reactivate(Request $request, ChurchSpaceReservation $churchSpaceReservation): JsonResponse
    {
        $user = $request->user();
        $isManager = in_array($user->role, ['admin', 'instructor'], true);

        if (! $isManager && $churchSpaceReservation->user_id !== $user->id) {
            abort(403);
        }

        if ($churchSpaceReservation->status !== 'cancelled') {
            throw ValidationException::withMessages([
                'status' => ['Solo se pueden reactivar reservas canceladas.'],
            ]);
        }

        $space = $churchSpaceReservation->space;
        $this->reservations->assertCanBook(
            $space,
            $churchSpaceReservation->starts_at,
            $churchSpaceReservation->ends_at,
            $churchSpaceReservation->attendees_count,
            $churchSpaceReservation->id
        );

        $churchSpaceReservation->status = $isManager
            ? 'confirmed'
            : $this->reservations->initialStatus($space);
        $churchSpaceReservation->cancelled_at = null;
        $churchSpaceReservation->cancelled_by = null;
        $churchSpaceReservation->save();

        return response()->json([
            'data' => $churchSpaceReservation->fresh()->load(['space:id,name,code,color', 'user:id,email', 'user.profile:user_id,first_name,last_name', 'ministry:id,name']),
            'message' => 'Reserva reactivada.',
        ]);
    }

    public function destroy(Request $request, ChurchSpaceReservation $churchSpaceReservation): JsonResponse
    {
        $user = $request->user();
        $isManager = in_array($user->role, ['admin', 'instructor'], true);

        if (! $isManager && $churchSpaceReservation->user_id !== $user->id) {
            abort(403);
        }

        if ($churchSpaceReservation->status !== 'cancelled') {
            throw ValidationException::withMessages([
                'status' => ['Solo se pueden eliminar reservas canceladas. Cancelala primero.'],
            ]);
        }

        $churchSpaceReservation->delete();

        return response()->json(['message' => 'Reserva eliminada.']);
    }

    public function approve(Request $request, ChurchSpaceReservation $churchSpaceReservation): JsonResponse
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);

        if ($churchSpaceReservation->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['Solo se pueden aprobar reservas pendientes.'],
            ]);
        }

        $this->reservations->assertCanBook(
            $churchSpaceReservation->space,
            $churchSpaceReservation->starts_at,
            $churchSpaceReservation->ends_at,
            $churchSpaceReservation->attendees_count,
            $churchSpaceReservation->id
        );

        $churchSpaceReservation->status = 'confirmed';
        $churchSpaceReservation->save();

        return response()->json([
            'data' => $churchSpaceReservation->fresh()->load(['space:id,name,code', 'user:id,email', 'user.profile:user_id,first_name,last_name', 'ministry:id,name']),
            'message' => 'Reserva aprobada.',
        ]);
    }

    public function cancelSeries(Request $request, string $seriesId): JsonResponse
    {
        $user = $request->user();
        $isManager = in_array($user->role, ['admin', 'instructor'], true);
        $count = $this->recurrences->cancelFixedSchedule($seriesId, $user, $isManager);

        if (! $count) {
            throw ValidationException::withMessages([
                'series_id' => ['No se encontró el horario fijo para cancelar.'],
            ]);
        }

        return response()->json([
            'data' => ['cancelled' => 1],
            'message' => 'Horario fijo cancelado.',
        ]);
    }
}
