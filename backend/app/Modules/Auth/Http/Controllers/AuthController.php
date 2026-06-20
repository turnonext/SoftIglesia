<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Http\Requests\ForgotPasswordRequest;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Requests\RegisterRequest;
use App\Modules\Auth\Http\Requests\ResetPasswordRequest;
use App\Modules\Auth\Models\RefreshToken;
use App\Modules\Auth\Models\User;
use App\Modules\Audit\Services\AccessLogService;
use App\Modules\Audit\Support\AccessLogAction;
use App\Modules\Auth\Services\PasswordResetService;
use App\Modules\Auth\Services\RefreshTokenService;
use App\Modules\Shared\Models\Tenant;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(
        private readonly RefreshTokenService $refreshTokens,
        private readonly PasswordResetService $passwordResets,
        private readonly AccessLogService $accessLog,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request->validated('tenant_slug'));
        if (! $tenant) {
            return response()->json(['message' => 'Organización no encontrada.'], 422);
        }

        app()->instance('current.tenant_id', $tenant->id);

        try {
            $user = User::query()->create([
                'tenant_id' => $tenant->id,
                'email' => $request->validated('email'),
                'password' => $request->validated('password'),
                'role' => 'student',
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'El email ya está registrado en esta organización.'], 422);
        }

        $this->accessLog->record(
            AccessLogAction::REGISTER,
            $request,
            true,
            $tenant->id,
            $user->id,
            $user->email,
            201,
        );

        $accessToken = JWTAuth::fromUser($user);
        $refresh = $this->refreshTokens->issue($user, $request);

        return response()->json([
            'user' => $this->userPayload($user),
            'access_token' => $accessToken,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
            'refresh_token' => $refresh['plain'],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request->validated('tenant_slug'));
        if (! $tenant) {
            return response()->json(['message' => 'Organización no encontrada.'], 422);
        }

        app()->instance('current.tenant_id', $tenant->id);

        $user = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('email', $request->validated('email'))
            ->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas.'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Usuario desactivado.'], 403);
        }

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        $this->accessLog->record(
            AccessLogAction::LOGIN,
            $request,
            true,
            $tenant->id,
            $user->id,
            $user->email,
            200,
        );

        $accessToken = JWTAuth::fromUser($user);
        $refresh = $this->refreshTokens->issue($user, $request);

        return response()->json([
            'user' => $this->userPayload($user),
            'access_token' => $accessToken,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
            'refresh_token' => $refresh['plain'],
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $request->validate(['refresh_token' => ['required', 'string']]);

        $row = $this->refreshTokens->rotate($request->input('refresh_token'), $request);
        if (! $row) {
            return response()->json(['message' => 'Refresh token inválido.'], 401);
        }

        $user = $row->user;
        app()->instance('current.tenant_id', $user->tenant_id);

        $accessToken = JWTAuth::fromUser($user);
        $refresh = $this->refreshTokens->issue($user, $request, $row->family_id);

        return response()->json([
            'access_token' => $accessToken,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
            'refresh_token' => $refresh['plain'],
        ]);
    }

    public function me(): JsonResponse
    {
        return response()->json(['user' => $this->userPayload(auth()->user())]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request->validated('tenant_slug'));
        if (! $tenant) {
            return response()->json(['message' => 'Si el email existe, enviaremos instrucciones de recuperación.']);
        }

        $user = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('email', $request->validated('email'))
            ->where('is_active', true)
            ->first();

        $payload = ['message' => 'Si el email existe, enviaremos instrucciones de recuperación.'];

        if ($user) {
            $this->accessLog->record(
                AccessLogAction::PASSWORD_FORGOT,
                $request,
                true,
                $tenant->id,
                $user->id,
                $user->email,
                200,
            );

            $plain = $this->passwordResets->issue($user);
            if (config('app.debug')) {
                $payload['reset_token'] = $plain;
                $payload['reset_url'] = config('app.url').'/reset-password?token='.$plain
                    .'&email='.urlencode($user->email).'&tenant='.$tenant->slug;
            }
        }

        return response()->json($payload);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant($request->validated('tenant_slug'));
        if (! $tenant) {
            return response()->json(['message' => 'Token inválido o expirado.'], 400);
        }

        $row = $this->passwordResets->consume($request->validated('token'));
        if (! $row) {
            return response()->json(['message' => 'Token inválido o expirado.'], 400);
        }

        $user = User::query()
            ->where('id', $row->user_id)
            ->where('tenant_id', $tenant->id)
            ->where('email', $request->validated('email'))
            ->first();

        if (! $user) {
            return response()->json(['message' => 'Token inválido o expirado.'], 400);
        }

        $user->update(['password' => $request->validated('password')]);

        $this->accessLog->record(
            AccessLogAction::PASSWORD_RESET,
            $request,
            true,
            $tenant->id,
            $user->id,
            $user->email,
            200,
        );

        return response()->json(['message' => 'Contraseña actualizada. Ya puedes iniciar sesión.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($request->filled('refresh_token')) {
            RefreshToken::query()
                ->where('token_hash', hash('sha256', $request->input('refresh_token')))
                ->update(['revoked_at' => now()]);
        }

        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Throwable) {
            // token ya inválido
        }

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    private function resolveTenant(string $slug): ?Tenant
    {
        return Tenant::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'email' => $user->email,
            'role' => $user->role,
            'email_verified_at' => $user->email_verified_at,
        ];
    }
}
