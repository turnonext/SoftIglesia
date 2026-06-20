<?php

namespace App\Modules\ChurchSeatEvents\Http\Controllers;

use App\Modules\ChurchSeatEvents\Http\Requests\StoreSeatEventRequest;
use App\Modules\ChurchSeatEvents\Http\Requests\UpdateSeatEventRequest;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEvent;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEventReservation;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEventSeat;
use App\Modules\ChurchSeatEvents\Services\SeatEventService;
use App\Modules\ChurchSeatEvents\Services\SeatReservationService;
use App\Modules\Shared\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SeatEventController extends Controller
{
    public function __construct(
        private readonly SeatEventService $events,
        private readonly SeatReservationService $reservations,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $spaceId = $request->query('church_space_id');

        $query = ChurchSeatEvent::query()
            ->with('space:id,name,code')
            ->withCount([
                'seats',
                'reservations as confirmed_reservations_count' => fn ($q) => $q->where('status', 'confirmed'),
            ])
            ->when(in_array($status, ['active', 'paused', 'finished'], true), fn ($q) => $q->where('status', $status))
            ->when($spaceId, fn ($q) => $q->where('church_space_id', $spaceId))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
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

    public function show(ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $churchSeatEvent->load([
            'space:id,name,code,building,floor',
            'sectors' => fn ($q) => $q->withCount('seats'),
        ]);

        return response()->json([
            'data' => $churchSeatEvent,
            'summary' => $this->events->eventSummary($churchSeatEvent),
            'reservation_url' => $this->reservationUrl($churchSeatEvent),
        ]);
    }

    public function store(StoreSeatEventRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $sectors = $validated['sectors'];
        unset($validated['sectors']);

        $event = $this->events->create($validated, $sectors);

        return response()->json([
            'data' => $event,
            'reservation_url' => $this->reservationUrl($event),
            'message' => 'Evento creado correctamente.',
        ], 201);
    }

    public function update(UpdateSeatEventRequest $request, ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $validated = $request->validated();
        $sectors = $validated['sectors'] ?? null;
        unset($validated['sectors']);

        $event = $this->events->update($churchSeatEvent, $validated, $sectors);

        return response()->json([
            'data' => $event,
            'reservation_url' => $this->reservationUrl($event),
            'message' => 'Evento actualizado.',
        ]);
    }

    public function regenerateToken(ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $event = $this->events->regenerateToken($churchSeatEvent);

        return response()->json([
            'data' => $event,
            'reservation_url' => $this->reservationUrl($event),
            'message' => 'Enlace regenerado. El enlace anterior ya no es válido.',
        ]);
    }

    public function togglePauseReservations(ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $event = $this->events->toggleReservationsPaused($churchSeatEvent);

        return response()->json([
            'data' => $event,
            'message' => $event->reservations_paused
                ? 'Reservas pausadas.'
                : 'Reservas reanudadas.',
        ]);
    }

    public function deactivate(ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $event = $this->events->deactivate($churchSeatEvent);

        return response()->json([
            'data' => $event,
            'message' => 'Evento desactivado. El enlace público ya no acepta reservas.',
        ]);
    }

    public function reactivate(ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $event = $this->events->reactivate($churchSeatEvent);

        return response()->json([
            'data' => $event,
            'message' => 'Evento reactivado. El enlace público vuelve a estar disponible.',
        ]);
    }

    public function destroy(ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $this->events->deleteEvent($churchSeatEvent);

        return response()->json([
            'message' => 'Evento eliminado correctamente.',
        ]);
    }

    public function seats(Request $request, ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $sessionToken = $request->query('session_token');

        return response()->json([
            'data' => $this->reservations->seatStatusMap($churchSeatEvent, is_string($sessionToken) ? $sessionToken : null),
        ]);
    }

    public function reservations(ChurchSeatEvent $churchSeatEvent): JsonResponse
    {
        $reservations = ChurchSeatEventReservation::query()
            ->where('church_seat_event_id', $churchSeatEvent->id)
            ->where('status', 'confirmed')
            ->with(['seat:id,label,church_seat_event_sector_id', 'seat.sector:id,name'])
            ->orderByDesc('confirmed_at')
            ->get();

        return response()->json(['data' => $reservations]);
    }

    public function toggleSeatBlock(ChurchSeatEvent $churchSeatEvent, ChurchSeatEventSeat $seat): JsonResponse
    {
        abort_unless($seat->church_seat_event_id === $churchSeatEvent->id, 404);

        $updated = $this->reservations->toggleSeatBlocked($seat);

        return response()->json([
            'data' => $updated,
            'message' => $updated->status === 'blocked' ? 'Asiento bloqueado.' : 'Asiento desbloqueado.',
        ]);
    }

    private function reservationUrl(ChurchSeatEvent $event): string
    {
        $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
        $tenantSlug = Tenant::query()->whereKey($event->tenant_id)->value('slug') ?? '';

        return "{$frontend}/reserve/{$event->reservation_token}?tenant={$tenantSlug}&v={$event->token_version}";
    }
}
