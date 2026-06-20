<?php

namespace App\Modules\User\Http\Controllers;

use App\Modules\Audit\Services\AccessLogService;
use App\Modules\Audit\Support\AccessLogAction;
use App\Modules\User\Models\Avatar;
use App\Modules\Shared\Support\PreferredStorageDisk;
use App\Modules\User\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileController extends Controller
{
    public function __construct(
        private readonly AccessLogService $accessLog,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = UserProfile::query()
            ->where('user_id', $user->id)
            ->first();

        $avatar = Avatar::query()
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->first();

        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
                'first_name' => $profile?->first_name,
                'last_name' => $profile?->last_name,
                'phone' => $profile?->phone,
                'bio' => $profile?->bio,
                'locale' => $profile?->locale ?? 'es',
                'timezone' => $profile?->timezone ?? 'UTC',
                'avatar_url' => $this->resolveAvatarUrl($avatar),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['nullable', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'locale' => ['nullable', 'string', 'max:8'],
            'timezone' => ['nullable', 'string', 'max:64'],
        ]);

        $user = $request->user();

        $existing = UserProfile::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->first();

        $changes = [];
        foreach ($data as $key => $value) {
            $previous = $existing?->{$key};
            if ($previous != $value) {
                $changes[$key] = ['from' => $previous, 'to' => $value];
            }
        }

        $profile = UserProfile::query()->updateOrCreate(
            [
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
            ],
            $data
        );

        $this->accessLog->recordDomain(
            AccessLogAction::PROFILE_UPDATED,
            $request,
            [
                'entity' => 'profile',
                'fields' => array_keys($changes),
                'changes' => $changes,
            ],
        );

        $avatar = Avatar::query()
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->first();

        return response()->json([
            'data' => $this->profilePayload($user, $profile, $avatar),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $file = $request->file('avatar');
        $directory = "avatars/{$user->tenant_id}/{$user->id}";

        [$disk, $path] = $this->storeAvatarFile($file, $directory);

        $avatar = Avatar::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'disk' => $disk,
                'path' => $path,
                'mime_type' => $file->getMimeType(),
                'size_bytes' => $file->getSize(),
            ]
        );

        $profile = UserProfile::query()
            ->where('user_id', $user->id)
            ->first();

        return response()->json([
            'data' => $this->profilePayload($user, $profile, $avatar),
            'message' => 'Foto de perfil actualizada.',
        ]);
    }

    public function avatar(Request $request): StreamedResponse|JsonResponse
    {
        $avatar = Avatar::query()
            ->where('user_id', $request->user()->id)
            ->latest('updated_at')
            ->first();

        if (! $avatar || ! Storage::disk($avatar->disk)->exists($avatar->path)) {
            return response()->json(['message' => 'Sin avatar.'], 404);
        }

        return Storage::disk($avatar->disk)->response(
            $avatar->path,
            'avatar',
            ['Content-Type' => $avatar->mime_type ?? 'image/jpeg']
        );
    }

    private function profilePayload($user, ?UserProfile $profile, ?Avatar $avatar): array
    {
        return [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'tenant_id' => $user->tenant_id,
            'first_name' => $profile?->first_name,
            'last_name' => $profile?->last_name,
            'phone' => $profile?->phone,
            'bio' => $profile?->bio,
            'locale' => $profile?->locale ?? 'es',
            'timezone' => $profile?->timezone ?? 'UTC',
            'avatar_url' => $this->resolveAvatarUrl($avatar),
        ];
    }

    private function resolveAvatarUrl(?Avatar $avatar): ?string
    {
        if (! $avatar || ! Storage::disk($avatar->disk)->exists($avatar->path)) {
            return null;
        }

        return rtrim(config('app.url'), '/').'/api/v1/users/profile/avatar';
    }

    /** @return array{0: string, 1: string} */
    private function storeAvatarFile($file, string $directory): array
    {
        $disk = PreferredStorageDisk::resolve();

        return [$disk, $file->store($directory, $disk)];
    }
}
