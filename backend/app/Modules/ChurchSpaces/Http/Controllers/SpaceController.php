<?php

namespace App\Modules\ChurchSpaces\Http\Controllers;

use App\Modules\ChurchSpaces\Http\Requests\StoreChurchSpaceRequest;
use App\Modules\ChurchSpaces\Http\Requests\UpdateChurchSpaceRequest;
use App\Modules\ChurchSpaces\Http\Requests\UpdateSpaceAppearanceRequest;
use App\Modules\ChurchSpaces\Http\Requests\UpdateSpacesLayoutRequest;
use App\Modules\ChurchSpaces\Models\ChurchSpace;
use App\Modules\ChurchSpaces\Services\SpaceReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;

class SpaceController extends Controller
{
    public function __construct(private readonly SpaceReservationService $reservations) {}
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $campusId = $request->query('campus_id');
        $onFloorPlan = filter_var($request->query('on_floor_plan'), FILTER_VALIDATE_BOOL);

        $baseQuery = ChurchSpace::query();

        $query = (clone $baseQuery)
            ->with('campus:id,name,code')
            ->when($onFloorPlan, fn ($q) => $q->whereNotNull('layout_x')->whereNotNull('layout_y'))
            ->when(in_array($status, ['available', 'maintenance', 'blocked'], true), fn ($q) => $q->where('status', $status))
            ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('building', 'like', "%{$search}%")
                        ->orWhere('floor', 'like', "%{$search}%");
                });
            })
            ->orderBy('building')
            ->orderBy('floor')
            ->orderBy('name');

        $perPage = min(50, max(10, (int) $request->query('per_page', 50)));
        $paginated = $query->paginate($perPage);

        $summaryQuery = $onFloorPlan
            ? (clone $baseQuery)->whereNotNull('layout_x')->whereNotNull('layout_y')
            : clone $baseQuery;

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'summary' => [
                'total' => (clone $summaryQuery)->count(),
                'available' => (clone $summaryQuery)->where('status', 'available')->count(),
                'maintenance' => (clone $summaryQuery)->where('status', 'maintenance')->count(),
                'blocked' => (clone $summaryQuery)->where('status', 'blocked')->count(),
            ],
        ]);
    }

    public function show(ChurchSpace $churchSpace): JsonResponse
    {
        $churchSpace->load('campus:id,name,code');

        return response()->json(['data' => $churchSpace]);
    }

    public function store(StoreChurchSpaceRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['status'] = $payload['status'] ?? 'available';
        $payload['capacity'] = $payload['capacity'] ?? 0;
        $payload['min_booking_minutes'] = $payload['min_booking_minutes'] ?? 30;
        $payload['max_booking_minutes'] = $payload['max_booking_minutes'] ?? 480;
        $payload['requires_approval'] = $payload['requires_approval'] ?? false;

        $space = ChurchSpace::query()->create($payload);

        return response()->json(['data' => $space->load('campus:id,name,code'), 'message' => 'Espacio creado.'], 201);
    }

    public function update(UpdateChurchSpaceRequest $request, ChurchSpace $churchSpace): JsonResponse
    {
        $churchSpace->fill($request->validated());
        $churchSpace->save();

        return response()->json([
            'data' => $churchSpace->fresh()->load('campus:id,name,code'),
            'message' => 'Espacio actualizado.',
        ]);
    }

    /** Guarda título y color del espacio en church_spaces (plano del edificio). */
    public function updateAppearance(UpdateSpaceAppearanceRequest $request, ChurchSpace $churchSpace): JsonResponse
    {
        $payload = $request->validated();

        if (array_key_exists('name', $payload)) {
            $churchSpace->name = $payload['name'];
        }
        if (array_key_exists('color', $payload)) {
            $churchSpace->color = $payload['color'];
        }

        $churchSpace->save();

        return response()->json([
            'data' => $churchSpace->fresh()->load('campus:id,name,code'),
            'message' => 'Apariencia del espacio guardada.',
        ]);
    }

    public function updateLayout(UpdateSpacesLayoutRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $floor = $payload['floor'] ?? null;
        $removedIds = $payload['removed_ids'] ?? [];

        if ($removedIds !== []) {
            $blockedNames = ChurchSpace::query()
                ->whereIn('id', $removedIds)
                ->get(['id', 'name'])
                ->filter(fn (ChurchSpace $space) => $this->reservations->activeReservationCount($space->id) > 0)
                ->pluck('name')
                ->values()
                ->all();

            if ($blockedNames !== []) {
                throw ValidationException::withMessages([
                    'removed_ids' => [
                        'No se puede quitar del plano un espacio con reservas activas: '
                        .implode(', ', $blockedNames).'.',
                    ],
                ]);
            }
        }

        foreach ($payload['layouts'] as $item) {
            $space = ChurchSpace::query()->find($item['id']);
            if (! $space) {
                continue;
            }

            $space->layout_x = $item['layout_x'];
            $space->layout_y = $item['layout_y'];
            $space->layout_w = $item['layout_w'];
            $space->layout_h = $item['layout_h'];
            if ($floor !== null) {
                $space->floor = $floor;
            }
            $space->save();
        }

        foreach ($payload['removed_ids'] ?? [] as $id) {
            $space = ChurchSpace::query()->find($id);
            if (! $space) {
                continue;
            }
            $space->layout_x = null;
            $space->layout_y = null;
            $space->layout_w = null;
            $space->layout_h = null;
            $space->floor = null;
            $space->save();
        }

        return response()->json(['message' => 'Plano del edificio actualizado.']);
    }

    public function layoutRemovalCheck(ChurchSpace $churchSpace): JsonResponse
    {
        $count = $this->reservations->activeReservationCount($churchSpace->id);

        return response()->json([
            'data' => [
                'removable' => $count === 0,
                'active_reservations' => $count,
                'space_name' => $churchSpace->name,
            ],
        ]);
    }
}
