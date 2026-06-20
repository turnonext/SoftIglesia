<?php

namespace App\Modules\ChurchGroups\Http\Controllers;

use App\Modules\ChurchGroups\Http\Requests\StoreChurchGroupRequest;
use App\Modules\ChurchGroups\Http\Requests\UpdateChurchGroupRequest;
use App\Modules\ChurchGroups\Models\ChurchGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ChurchGroupController extends Controller
{
    public function map(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $type = $request->query('type');

        $groups = ChurchGroup::query()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->when(in_array($status, ['active', 'inactive', 'paused'], true), fn ($q) => $q->where('status', $status))
            ->when(in_array($type, ['cell', 'ministry', 'youth', 'other'], true), fn ($q) => $q->where('type', $type))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('leader_name', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('address_line', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'type',
                'status',
                'leader_name',
                'meeting_day',
                'meeting_time',
                'address_line',
                'city',
                'latitude',
                'longitude',
                'member_count',
            ]);

        return response()->json([
            'data' => $groups,
            'meta' => [
                'total' => $groups->count(),
                'with_coordinates' => $groups->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $type = $request->query('type');

        $query = ChurchGroup::query()
            ->when(in_array($status, ['active', 'inactive', 'paused'], true), fn ($q) => $q->where('status', $status))
            ->when(in_array($type, ['cell', 'ministry', 'youth', 'other'], true), fn ($q) => $q->where('type', $type))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('leader_name', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('weekly_topic', 'like', "%{$search}%");
                });
            })
            ->orderBy('name');

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

    public function store(StoreChurchGroupRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['type'] = $payload['type'] ?? 'cell';
        $payload['status'] = $payload['status'] ?? 'active';
        $payload['member_count'] = $payload['member_count'] ?? 0;

        $group = ChurchGroup::query()->create($payload);

        return response()->json(['data' => $group], 201);
    }

    public function show(ChurchGroup $churchGroup): JsonResponse
    {
        return response()->json(['data' => $churchGroup]);
    }

    public function update(UpdateChurchGroupRequest $request, ChurchGroup $churchGroup): JsonResponse
    {
        $churchGroup->fill($request->validated());
        $churchGroup->save();

        return response()->json([
            'data' => $churchGroup->fresh(),
            'message' => 'Grupo actualizado.',
        ]);
    }
}
