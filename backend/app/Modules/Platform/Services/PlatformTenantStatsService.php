<?php

namespace App\Modules\Platform\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PlatformTenantStatsService
{
    /**
     * @return array<string, int|string|null>
     */
    public function snapshot(string $tenantId): array
    {
        $roles = $this->usersByRole($tenantId);

        return [
            'users' => array_sum($roles),
            'students' => $roles['student'] ?? 0,
            'instructors' => $roles['instructor'] ?? 0,
            'admins' => $roles['admin'] ?? 0,
            'courses' => $this->countTable('courses', $tenantId, fn ($q) => $q->whereNull('deleted_at')),
            'courses_published' => $this->countTable('courses', $tenantId, function ($q) {
                $q->whereNull('deleted_at');
                if (Schema::hasColumn('courses', 'status')) {
                    $q->where('status', 'published');
                } elseif (Schema::hasColumn('courses', 'published_at')) {
                    $q->whereNotNull('published_at');
                }
            }),
            'enrollments' => $this->countTable('enrollments', $tenantId),
            'classes' => $this->countTable('classes', $tenantId, fn ($q) => $q->whereNull('deleted_at')),
            'files' => $this->countTable('files', $tenantId, fn ($q) => $q->whereNull('deleted_at')),
            'certificate_templates' => $this->countTable('certificate_templates', $tenantId),
            'last_activity_at' => $this->lastActivityAt($tenantId),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function usersByRole(string $tenantId): array
    {
        if (! Schema::hasTable('users')) {
            return [];
        }

        $rows = DB::table('users')
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $out[$row->role] = (int) $row->total;
        }

        return $out;
    }

    /**
     * @param  callable(\Illuminate\Database\Query\Builder): void|null  $constraint
     */
    private function countTable(string $table, string $tenantId, ?callable $constraint = null): int
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'tenant_id')) {
            return 0;
        }

        $query = DB::table($table)->where('tenant_id', $tenantId);
        if ($constraint) {
            $constraint($query);
        }

        return (int) $query->count();
    }

    private function lastActivityAt(string $tenantId): ?string
    {
        if (! Schema::hasTable('users')) {
            return null;
        }

        $lastLogin = DB::table('users')
            ->where('tenant_id', $tenantId)
            ->whereNotNull('last_login_at')
            ->max('last_login_at');

        return $lastLogin ? (string) $lastLogin : null;
    }
}
