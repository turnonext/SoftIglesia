<?php

namespace App\Modules\Analytics\Http\Controllers;

use App\Modules\Auth\Models\User;
use App\Modules\ChurchCampuses\Models\ChurchCampus;
use App\Modules\ChurchFinance\Models\FinanceTransaction;
use App\Modules\ChurchGatherings\Models\ChurchGathering;
use App\Modules\ChurchGroups\Models\ChurchGroup;
use App\Modules\ChurchMinistries\Models\ChurchMinistry;
use App\Modules\ChurchPeople\Models\Member;
use App\Modules\Classroom\Models\ClassSession;
use App\Modules\Course\Models\Course;
use App\Modules\Course\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = app('current.tenant_id') ?? $user->tenant_id;

        if (in_array($user->role, ['admin', 'instructor'], true)) {
            return response()->json([
                'scope' => 'tenant',
                'kpis' => $this->tenantLmsKpis($tenantId),
                'church' => $this->churchKpis($tenantId),
                'formation' => $this->formationExtras($tenantId),
                'recent' => $this->recentActivity($tenantId),
                'alerts' => $this->pastoralAlerts($tenantId),
            ]);
        }

        $enrollmentQuery = Enrollment::query()
            ->where('tenant_id', $tenantId)
            ->where('student_user_id', $user->id);

        return response()->json([
            'scope' => 'student',
            'kpis' => [
                'users' => 0,
                'courses' => Course::query()
                    ->where('tenant_id', $tenantId)
                    ->whereHas('enrollments', fn ($q) => $q->where('student_user_id', $user->id))
                    ->count(),
                'enrollments' => (clone $enrollmentQuery)->where('status', 'active')->count(),
                'published_courses' => Course::query()
                    ->where('tenant_id', $tenantId)
                    ->where('status', 'published')
                    ->count(),
            ],
            'formation' => [
                'upcoming_classes' => ClassSession::query()
                    ->where('tenant_id', $tenantId)
                    ->where('starts_at', '>=', now())
                    ->whereIn('status', ['scheduled', 'live'])
                    ->count(),
            ],
            'recent' => [
                'classes' => ClassSession::query()
                    ->where('tenant_id', $tenantId)
                    ->where('starts_at', '>=', now())
                    ->orderBy('starts_at')
                    ->limit(5)
                    ->get(['id', 'title', 'starts_at', 'status'])
                    ->map(fn ($c) => [
                        'id' => $c->id,
                        'title' => $c->title,
                        'starts_at' => $c->starts_at?->toIso8601String(),
                        'status' => $c->status,
                    ]),
            ],
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function tenantLmsKpis(string $tenantId): array
    {
        return [
            'users' => User::query()->where('tenant_id', $tenantId)->count(),
            'courses' => Course::query()->where('tenant_id', $tenantId)->count(),
            'enrollments' => Enrollment::query()->where('tenant_id', $tenantId)->count(),
            'published_courses' => Course::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'published')
                ->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function churchKpis(string $tenantId): array
    {
        $monthStart = now()->startOfMonth()->toDateString();

        $financeQuery = FinanceTransaction::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('occurred_on', '>=', $monthStart);

        $income = 0.0;
        $expense = 0.0;
        $currency = 'ARS';

        foreach ($financeQuery->get(['kind', 'amount', 'currency']) as $tx) {
            $currency = $tx->currency ?: $currency;
            $amount = (float) $tx->amount;
            if ($tx->kind === 'expense') {
                $expense += $amount;
            } else {
                $income += $amount;
            }
        }

        return [
            'members_total' => Member::query()->where('tenant_id', $tenantId)->count(),
            'members_active' => Member::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'member')
                ->count(),
            'visitors' => Member::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'visitor')
                ->count(),
            'groups_active' => ChurchGroup::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->count(),
            'groups_mapped' => ChurchGroup::query()
                ->where('tenant_id', $tenantId)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->count(),
            'gatherings_upcoming' => ChurchGathering::query()
                ->where('tenant_id', $tenantId)
                ->where('starts_at', '>=', now())
                ->where('status', '!=', 'cancelled')
                ->count(),
            'campuses' => ChurchCampus::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->count(),
            'ministries' => ChurchMinistry::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->count(),
            'finance_month' => [
                'income' => round($income, 2),
                'expense' => round($expense, 2),
                'balance' => round($income - $expense, 2),
                'currency' => $currency,
                'period_label' => now()->translatedFormat('F Y'),
            ],
        ];
    }

    /**
     * @return array<string, int>
     */
    private function formationExtras(string $tenantId): array
    {
        return [
            'upcoming_classes' => ClassSession::query()
                ->where('tenant_id', $tenantId)
                ->where('starts_at', '>=', now())
                ->whereIn('status', ['scheduled', 'live'])
                ->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function recentActivity(string $tenantId): array
    {
        return [
            'gatherings' => ChurchGathering::query()
                ->where('tenant_id', $tenantId)
                ->where('starts_at', '>=', now())
                ->where('status', '!=', 'cancelled')
                ->orderBy('starts_at')
                ->limit(5)
                ->get(['id', 'title', 'starts_at', 'location', 'type', 'status'])
                ->map(fn ($g) => [
                    'id' => $g->id,
                    'title' => $g->title,
                    'starts_at' => $g->starts_at?->toIso8601String(),
                    'location' => $g->location,
                    'type' => $g->type,
                    'status' => $g->status,
                ]),
            'members' => Member::query()
                ->where('tenant_id', $tenantId)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'first_name', 'last_name', 'status', 'created_at'])
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => trim("{$m->first_name} {$m->last_name}"),
                    'status' => $m->status,
                    'created_at' => $m->created_at?->toIso8601String(),
                ]),
            'classes' => ClassSession::query()
                ->where('tenant_id', $tenantId)
                ->where('starts_at', '>=', now())
                ->orderBy('starts_at')
                ->limit(5)
                ->get(['id', 'title', 'starts_at', 'status'])
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'starts_at' => $c->starts_at?->toIso8601String(),
                    'status' => $c->status,
                ]),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function pastoralAlerts(string $tenantId): array
    {
        $inactiveThreshold = now()->subDays(30);

        return [
            'visitors_pending' => Member::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'visitor')
                ->count(),
            'members_inactive' => Member::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'inactive')
                ->count(),
            'members_no_recent_attendance' => Member::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'member')
                ->where(function ($q) use ($inactiveThreshold) {
                    $q->whereNull('last_attended_at')
                        ->orWhere('last_attended_at', '<', $inactiveThreshold);
                })
                ->count(),
        ];
    }
}
