<?php

namespace App\Modules\ChurchPeople\Http\Controllers;

use App\Modules\ChurchPeople\Http\Requests\StorePublicMemberRequest;
use App\Modules\ChurchPeople\Models\Member;
use App\Modules\ChurchPeople\Models\MemberTimelineEvent;
use App\Modules\ChurchPeople\Models\Nationality;
use App\Modules\ChurchPeople\Models\Profession;
use App\Modules\ChurchPeople\Services\MemberRegistrationService;
use App\Modules\Shared\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class PublicMemberRegistrationController extends Controller
{
    public function __construct(
        private readonly MemberRegistrationService $registration,
    ) {}

    public function config(): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('current.tenant');

        return response()->json(['data' => $this->registration->publicConfig($tenant)]);
    }

    public function catalogs(): JsonResponse
    {
        $tenantId = app('current.tenant_id');

        $professions = Profession::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        $nationalities = Nationality::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return response()->json([
            'data' => [
                'tenant_id' => $tenantId,
                'professions' => $professions,
                'nationalities' => $nationalities,
            ],
        ]);
    }

    public function store(StorePublicMemberRequest $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app('current.tenant');

        $payload = $this->registration->filterPublicPayload(
            $tenant,
            $request->safe()->except(['tenant_slug', 'token'])
        );
        $payload['status'] = 'visitor';
        $payload['visitor_since'] = now()->toDateString();

        $member = Member::query()->create($payload);
        $member->load(['profession:id,name', 'nationality:id,name,code']);

        MemberTimelineEvent::query()->create([
            'member_id' => $member->id,
            'type' => 'member_created',
            'title' => 'Auto-registro',
            'description' => 'La persona completó el formulario público de registro.',
            'event_at' => now(),
            'metadata' => [
                'source' => 'public_registration',
                'ip' => $request->ip(),
            ],
        ]);

        return response()->json([
            'data' => [
                'id' => $member->id,
                'first_name' => $member->first_name,
                'last_name' => $member->last_name,
            ],
            'message' => 'Registro completado. ¡Gracias por registrarte!',
        ], 201);
    }
}
