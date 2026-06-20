<?php

namespace App\Modules\ChurchCampuses\Http\Controllers;

use App\Modules\ChurchCampuses\Models\ChurchCampus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CampusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');

        $query = ChurchCampus::query()
            ->when(in_array($status, ['active', 'inactive', 'planned'], true), fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('leader_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('is_headquarters')
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
                'total' => ChurchCampus::query()->count(),
                'active' => ChurchCampus::query()->where('status', 'active')->count(),
                'headquarters' => ChurchCampus::query()->where('is_headquarters', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'code' => ['nullable', 'string', 'max:32'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:180'],
            'leader_name' => ['nullable', 'string', 'max:160'],
            'status' => ['nullable', 'in:active,inactive,planned'],
            'is_headquarters' => ['nullable', 'boolean'],
            'member_count' => ['nullable', 'integer', 'min:0'],
            'group_count' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $payload['status'] = $payload['status'] ?? 'active';
        $payload['member_count'] = $payload['member_count'] ?? 0;
        $payload['group_count'] = $payload['group_count'] ?? 0;

        if (! empty($payload['is_headquarters'])) {
            ChurchCampus::query()->update(['is_headquarters' => false]);
        }

        $campus = ChurchCampus::query()->create($payload);

        return response()->json(['data' => $campus, 'message' => 'Sede creada.'], 201);
    }

    public function show(ChurchCampus $churchCampus): JsonResponse
    {
        return response()->json(['data' => $churchCampus]);
    }

    public function update(Request $request, ChurchCampus $churchCampus): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $payload = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'code' => ['sometimes', 'nullable', 'string', 'max:32'],
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'state' => ['sometimes', 'nullable', 'string', 'max:120'],
            'country' => ['sometimes', 'nullable', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'email' => ['sometimes', 'nullable', 'email', 'max:180'],
            'leader_name' => ['sometimes', 'nullable', 'string', 'max:160'],
            'status' => ['sometimes', 'nullable', 'in:active,inactive,planned'],
            'is_headquarters' => ['sometimes', 'boolean'],
            'member_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'group_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        if (array_key_exists('is_headquarters', $payload) && $payload['is_headquarters']) {
            ChurchCampus::query()->where('id', '!=', $churchCampus->id)->update(['is_headquarters' => false]);
        }

        $churchCampus->fill($payload);
        $churchCampus->save();

        return response()->json([
            'data' => $churchCampus->fresh(),
            'message' => 'Sede actualizada.',
        ]);
    }
}
