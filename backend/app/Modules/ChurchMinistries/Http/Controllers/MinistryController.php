<?php

namespace App\Modules\ChurchMinistries\Http\Controllers;

use App\Modules\ChurchMinistries\Models\ChurchMinistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MinistryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $type = $request->query('type');

        $query = ChurchMinistry::query()
            ->when(in_array($status, ['active', 'inactive', 'paused'], true), fn ($q) => $q->where('status', $status))
            ->when(in_array($type, ['worship', 'children', 'youth', 'outreach', 'media', 'general'], true), fn ($q) => $q->where('type', $type))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('leader_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
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
            'summary' => [
                'total' => ChurchMinistry::query()->count(),
                'active' => ChurchMinistry::query()->where('status', 'active')->count(),
                'volunteers' => ChurchMinistry::query()->sum('volunteer_count'),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['nullable', 'in:worship,children,youth,outreach,media,general'],
            'campus_id' => ['nullable', 'string', 'max:26'],
            'leader_name' => ['nullable', 'string', 'max:160'],
            'leader_email' => ['nullable', 'email', 'max:180'],
            'leader_phone' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', 'in:active,inactive,paused'],
            'member_count' => ['nullable', 'integer', 'min:0'],
            'volunteer_count' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $payload['type'] = $payload['type'] ?? 'general';
        $payload['status'] = $payload['status'] ?? 'active';
        $payload['member_count'] = $payload['member_count'] ?? 0;
        $payload['volunteer_count'] = $payload['volunteer_count'] ?? 0;

        $ministry = ChurchMinistry::query()->create($payload);

        return response()->json(['data' => $ministry, 'message' => 'Ministerio creado.'], 201);
    }

    public function show(ChurchMinistry $churchMinistry): JsonResponse
    {
        return response()->json(['data' => $churchMinistry]);
    }

    public function update(Request $request, ChurchMinistry $churchMinistry): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $churchMinistry->fill($request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'type' => ['sometimes', 'nullable', 'in:worship,children,youth,outreach,media,general'],
            'campus_id' => ['sometimes', 'nullable', 'string', 'max:26'],
            'leader_name' => ['sometimes', 'nullable', 'string', 'max:160'],
            'leader_email' => ['sometimes', 'nullable', 'email', 'max:180'],
            'leader_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'status' => ['sometimes', 'nullable', 'in:active,inactive,paused'],
            'member_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'volunteer_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]));
        $churchMinistry->save();

        return response()->json([
            'data' => $churchMinistry->fresh(),
            'message' => 'Ministerio actualizado.',
        ]);
    }
}
