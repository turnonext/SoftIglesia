<?php

namespace App\Modules\User\Http\Controllers;

use App\Modules\Auth\Models\User;
use App\Modules\User\Http\Requests\UpdateTenantUserRequest;
use App\Modules\User\Models\UserProfile;
use App\Modules\Audit\Services\AccessLogService;
use App\Modules\Audit\Support\AccessLogAction;
use App\Modules\Notification\Services\TenantMailService;
use App\Modules\User\Services\TenantUserPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class TenantUserController extends Controller
{
    public function __construct(
        private readonly TenantUserPresenter $presenter,
        private readonly TenantMailService $mail,
        private readonly AccessLogService $accessLog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Solo administradores pueden ver usuarios del tenant.');

        $search = trim((string) $request->query('q', ''));
        $roleFilter = $request->query('role');

        $query = User::query()
            ->where('tenant_id', $request->user()->tenant_id)
            ->when(
                in_array($roleFilter, ['student', 'instructor', 'admin'], true),
                fn ($q) => $q->where('role', $roleFilter)
            )
            ->when(
                $request->has('is_active'),
                fn ($q) => $q->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN))
            )
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('email', 'like', "%{$search}%")
                        ->orWhereIn('id', UserProfile::query()
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->pluck('user_id'));
                });
            })
            ->orderByRaw("FIELD(role, 'admin', 'instructor', 'student')")
            ->orderBy('email');

        $perPage = min(50, max(10, (int) $request->query('per_page', 20)));
        $paginated = $query->paginate($perPage);

        $userIds = collect($paginated->items())->pluck('id');
        $profiles = UserProfile::query()
            ->whereIn('user_id', $userIds)
            ->get()
            ->keyBy('user_id');

        $data = collect($paginated->items())->map(
            fn (User $user) => $this->presenter->present($user, $profiles->get($user->id))
        );

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function update(UpdateTenantUserRequest $request, User $user): JsonResponse
    {
        abort_unless($user->tenant_id === $request->user()->tenant_id, 404);

        $payload = $request->validated();
        $previousRole = $user->role;
        $previousActive = $user->is_active;
        $changes = [];

        if (array_key_exists('role', $payload)) {
            $user->role = $payload['role'];
            if ($previousRole !== $user->role) {
                $changes['role'] = ['from' => $previousRole, 'to' => $user->role];
            }
        }
        if (array_key_exists('is_active', $payload)) {
            $user->is_active = (bool) $payload['is_active'];
            if ($previousActive !== $user->is_active) {
                $changes['is_active'] = ['from' => $previousActive, 'to' => $user->is_active];
            }
        }

        $user->save();

        $profile = UserProfile::query()->where('user_id', $user->id)->first();

        $mailSent = false;
        if ($previousRole === 'student' && $user->role === 'instructor') {
            try {
                $mailSent = $this->mail->sendPromotedToInstructor($user, $profile, $user->tenant_id);
            } catch (\Throwable $e) {
                Log::error('Promoted instructor mail failed', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                $this->accessLog->recordDomain(
                    AccessLogAction::USER_ASSIGNED_INSTRUCTOR,
                    $request,
                    [
                        'entity' => 'user',
                        'target_user_id' => $user->id,
                        'target_email' => $user->email,
                        'role' => 'instructor',
                    ],
                );
            } catch (\Throwable $e) {
                Log::warning('Audit log failed after instructor promotion', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        } elseif ($changes !== []) {
            try {
                $this->accessLog->recordDomain(
                    AccessLogAction::USER_UPDATED,
                    $request,
                    [
                        'entity' => 'user',
                        'target_user_id' => $user->id,
                        'target_email' => $user->email,
                        'changes' => $changes,
                    ],
                );
            } catch (\Throwable $e) {
                Log::warning('Audit log failed after user update', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'data' => $this->presenter->present($user, $profile),
            'message' => $mailSent
                ? 'Usuario actualizado. Se envió el correo de bienvenida como profesor.'
                : 'Usuario actualizado.',
            'email_sent' => $mailSent,
        ]);
    }
}
