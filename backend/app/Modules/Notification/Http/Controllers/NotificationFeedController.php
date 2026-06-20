<?php

namespace App\Modules\Notification\Http\Controllers;

use App\Modules\Notification\Models\UserNotification;
use App\Modules\Notification\Services\ActivityFeedService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NotificationFeedController extends Controller
{
    public function __construct(private readonly ActivityFeedService $feed) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = app('current.tenant_id') ?? $user->tenant_id;

        $items = $this->feed->build($tenantId, $user);
        $readIds = $this->readFeedIds($user->id, $tenantId);

        $data = $items->map(function (array $item) use ($readIds) {
            $item['read'] = in_array($item['id'], $readIds, true);

            return $item;
        })->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'unread' => $data->where('read', false)->count(),
                'total' => $data->count(),
            ],
        ]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = app('current.tenant_id') ?? $user->tenant_id;

        $payload = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string', 'max:80'],
        ]);

        foreach ($payload['ids'] as $feedId) {
            $this->markFeedId($tenantId, $user->id, $feedId);
        }

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = app('current.tenant_id') ?? $user->tenant_id;

        $items = $this->feed->build($tenantId, $user);

        foreach ($items as $item) {
            $this->markFeedId($tenantId, $user->id, $item['id']);
        }

        return response()->json(['message' => 'Todas las notificaciones fueron marcadas como leídas.']);
    }

    /**
     * @return array<int, string>
     */
    private function readFeedIds(string $userId, string $tenantId): array
    {
        return UserNotification::query()
            ->withoutGlobalScope(\App\Modules\Shared\Scopes\TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->where('channel', 'in_app')
            ->where('type', 'feed_read')
            ->whereNotNull('read_at')
            ->get(['payload'])
            ->map(fn (UserNotification $n) => (string) ($n->payload['feed_id'] ?? ''))
            ->filter()
            ->values()
            ->all();
    }

    private function markFeedId(string $tenantId, string $userId, string $feedId): void
    {
        $query = UserNotification::query()
            ->withoutGlobalScope(\App\Modules\Shared\Scopes\TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->where('channel', 'in_app')
            ->where('type', 'feed_read')
            ->where('payload->feed_id', $feedId);

        $existing = $query->first();

        if ($existing) {
            $existing->read_at = now();
            $existing->save();

            return;
        }

        UserNotification::query()
            ->withoutGlobalScope(\App\Modules\Shared\Scopes\TenantScope::class)
            ->create([
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'channel' => 'in_app',
                'type' => 'feed_read',
                'payload' => ['feed_id' => $feedId],
                'read_at' => now(),
            ]);
    }
}
