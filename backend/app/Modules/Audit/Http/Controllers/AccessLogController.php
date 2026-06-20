<?php

namespace App\Modules\Audit\Http\Controllers;

use App\Modules\Audit\Models\AccessLog;
use App\Modules\Audit\Support\AccessLogAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;

class AccessLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);
        abort_unless(Schema::hasTable('log_acceso'), 503, 'Ejecuta migraciones: log_acceso.');

        $tenantId = $request->user()->tenant_id;

        $category = $request->query('category');
        $categoryActions = match ($category) {
            'access' => AccessLogAction::accessActions(),
            'system' => AccessLogAction::systemActions(),
            default => null,
        };

        $query = AccessLog::query()
            ->where('tenant_id', $tenantId)
            ->when(
                is_array($categoryActions),
                fn ($q) => $q->whereIn('action', $categoryActions)
            )
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->query('action')))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->query('user_id')))
            ->when($request->has('success'), function ($q) use ($request) {
                $q->where('success', filter_var($request->query('success'), FILTER_VALIDATE_BOOLEAN));
            })
            ->when($request->filled('from'), fn ($q) => $q->where('created_at', '>=', $request->query('from')))
            ->when($request->filled('to'), fn ($q) => $q->where('created_at', '<=', $request->query('to')))
            ->orderByDesc('created_at');

        $perPage = min(100, max(10, (int) $request->query('per_page', 25)));
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => collect($paginated->items())->map(fn (AccessLog $log) => $this->present($log)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(AccessLog $log): array
    {
        return [
            'id' => $log->id,
            'tenant_id' => $log->tenant_id,
            'user_id' => $log->user_id,
            'email' => $log->email,
            'action' => $log->action,
            'method' => $log->method,
            'path' => $log->path,
            'ip_address' => $log->ip_address,
            'status_code' => $log->status_code,
            'success' => $log->success,
            'metadata' => $log->metadata,
            'created_at' => $log->created_at?->toIso8601String(),
        ];
    }
}
