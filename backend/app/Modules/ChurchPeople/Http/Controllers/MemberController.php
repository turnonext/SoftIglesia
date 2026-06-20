<?php

namespace App\Modules\ChurchPeople\Http\Controllers;

use App\Modules\ChurchPeople\Http\Requests\StoreMemberRequest;
use App\Modules\ChurchPeople\Http\Requests\UpdateMemberRequest;
use App\Modules\ChurchPeople\Models\Member;
use App\Modules\ChurchPeople\Models\MemberTimelineEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');

        $query = Member::query()
            ->with([
                'profession:id,name',
                'nationality:id,name,code',
                'churchGroup:id,name,type',
            ])
            ->when(in_array($status, ['visitor', 'member', 'inactive', 'moved'], true), fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('family_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('last_attended_at')
            ->orderBy('first_name')
            ->orderBy('last_name');

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

    public function store(StoreMemberRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['status'] = $payload['status'] ?? 'visitor';

        $member = Member::query()->create($payload);
        $member->load(['profession:id,name', 'nationality:id,name,code', 'churchGroup:id,name,type']);

        MemberTimelineEvent::query()->create([
            'member_id' => $member->id,
            'type' => 'member_created',
            'title' => 'Ficha creada',
            'description' => 'Se registró un nuevo perfil de persona.',
            'event_at' => now(),
            'metadata' => [
                'created_by' => $request->user()?->id,
                'status' => $member->status,
            ],
        ]);

        return response()->json(['data' => $member], 201);
    }

    public function show(Member $member): JsonResponse
    {
        $member->load(['timelineEvents', 'profession:id,name', 'nationality:id,name,code', 'churchGroup:id,name,type']);

        return response()->json(['data' => $member]);
    }

    public function update(UpdateMemberRequest $request, Member $member): JsonResponse
    {
        $before = $member->only(['status', 'discipleship_stage', 'spiritual_status']);
        $member->fill($request->validated());
        $member->save();

        $after = $member->only(['status', 'discipleship_stage', 'spiritual_status']);
        $changes = array_filter([
            'status' => $before['status'] !== $after['status'] ? ['from' => $before['status'], 'to' => $after['status']] : null,
            'discipleship_stage' => $before['discipleship_stage'] !== $after['discipleship_stage'] ? ['from' => $before['discipleship_stage'], 'to' => $after['discipleship_stage']] : null,
            'spiritual_status' => $before['spiritual_status'] !== $after['spiritual_status'] ? ['from' => $before['spiritual_status'], 'to' => $after['spiritual_status']] : null,
        ]);

        if ($changes !== []) {
            MemberTimelineEvent::query()->create([
                'member_id' => $member->id,
                'type' => 'member_updated',
                'title' => 'Perfil actualizado',
                'description' => 'Se actualizaron datos pastorales del miembro.',
                'event_at' => now(),
                'metadata' => [
                    'updated_by' => $request->user()?->id,
                    'changes' => $changes,
                ],
            ]);
        }

        return response()->json([
            'data' => $member->fresh(['timelineEvents', 'profession:id,name', 'nationality:id,name,code', 'churchGroup:id,name,type']),
            'message' => 'Miembro actualizado.',
        ]);
    }
}
