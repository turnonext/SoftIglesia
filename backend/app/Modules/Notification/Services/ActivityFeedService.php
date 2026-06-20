<?php

namespace App\Modules\Notification\Services;

use App\Modules\Auth\Models\User;
use App\Modules\ChurchFinance\Models\FinanceTransaction;
use App\Modules\ChurchGatherings\Models\ChurchGathering;
use App\Modules\ChurchGroups\Models\ChurchGroup;
use App\Modules\ChurchPeople\Models\Member;
use App\Modules\ChurchSpaces\Models\ChurchSpace;
use App\Modules\ChurchSpaces\Models\ChurchSpaceReservation;
use App\Modules\Classroom\Models\ClassSession;
use App\Modules\Course\Models\Course;
use App\Modules\Course\Models\Enrollment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ActivityFeedService
{
    private const DAYS_BACK = 14;

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function build(string $tenantId, User $user): Collection
    {
        $since = now()->subDays(self::DAYS_BACK);
        $items = collect();
        $role = $user->role;

        if (in_array($role, ['admin', 'instructor'], true)) {
            $items = $items->merge($this->churchItems($tenantId, $since, $role));
            $items = $items->merge($this->formationAdminItems($tenantId, $since));
        } else {
            $items = $items->merge($this->formationStudentItems($tenantId, $since, $user->id));
        }

        return $items
            ->sortByDesc(fn (array $item) => $item['occurred_at'])
            ->values()
            ->take(40);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function churchItems(string $tenantId, Carbon $since, string $role): Collection
    {
        $items = collect();

        Member::query()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(15)
            ->get(['id', 'first_name', 'last_name', 'status', 'created_at'])
            ->each(function (Member $m) use ($items) {
                $name = trim("{$m->first_name} {$m->last_name}");
                $items->push([
                    'id' => "member:{$m->id}",
                    'category' => 'church',
                    'type' => 'member.created',
                    'title' => 'Nueva persona registrada',
                    'message' => "{$name} ({$m->status})",
                    'href' => '/church/people',
                    'occurred_at' => $m->created_at?->toIso8601String(),
                ]);
            });

        ChurchGroup::query()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'name', 'city', 'created_at'])
            ->each(function (ChurchGroup $g) use ($items) {
                $items->push([
                    'id' => "group:{$g->id}",
                    'category' => 'church',
                    'type' => 'group.created',
                    'title' => 'Nuevo grupo / célula',
                    'message' => $g->name.($g->city ? " · {$g->city}" : ''),
                    'href' => '/church/groups',
                    'occurred_at' => $g->created_at?->toIso8601String(),
                ]);
            });

        ChurchGathering::query()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'title', 'starts_at', 'created_at'])
            ->each(function (ChurchGathering $g) use ($items) {
                $items->push([
                    'id' => "gathering-created:{$g->id}",
                    'category' => 'church',
                    'type' => 'gathering.created',
                    'title' => 'Reunión programada',
                    'message' => $g->title,
                    'href' => '/church/gatherings',
                    'occurred_at' => $g->created_at?->toIso8601String(),
                ]);
            });

        ChurchGathering::query()
            ->where('tenant_id', $tenantId)
            ->where('starts_at', '>=', now())
            ->where('starts_at', '<=', now()->addDays(7))
            ->where('status', '!=', 'cancelled')
            ->orderBy('starts_at')
            ->limit(8)
            ->get(['id', 'title', 'starts_at'])
            ->each(function (ChurchGathering $g) use ($items) {
                $items->push([
                    'id' => "gathering-upcoming:{$g->id}",
                    'category' => 'church',
                    'type' => 'gathering.upcoming',
                    'title' => 'Reunión próxima',
                    'message' => $g->title.' · '.$g->starts_at?->format('d/m H:i'),
                    'href' => '/church/gatherings',
                    'occurred_at' => now()->toIso8601String(),
                ]);
            });

        ChurchSpace::query()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get(['id', 'name', 'created_at'])
            ->each(function (ChurchSpace $s) use ($items) {
                $items->push([
                    'id' => "space:{$s->id}",
                    'category' => 'church',
                    'type' => 'space.created',
                    'title' => 'Nuevo espacio registrado',
                    'message' => $s->name,
                    'href' => '/church/spaces',
                    'occurred_at' => $s->created_at?->toIso8601String(),
                ]);
            });

        ChurchSpaceReservation::query()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', $since)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->with('space:id,name')
            ->get(['id', 'church_space_id', 'title', 'starts_at', 'created_at'])
            ->each(function (ChurchSpaceReservation $r) use ($items) {
                $spaceName = $r->space?->name ?? 'Espacio';
                $items->push([
                    'id' => "space-reservation:{$r->id}",
                    'category' => 'church',
                    'type' => 'space.reservation',
                    'title' => 'Nueva reserva de espacio',
                    'message' => "{$r->title} · {$spaceName} · ".$r->starts_at?->format('d/m H:i'),
                    'href' => '/church/spaces',
                    'occurred_at' => $r->created_at?->toIso8601String(),
                ]);
            });

        if ($role === 'admin') {
            FinanceTransaction::query()
                ->where('tenant_id', $tenantId)
                ->where('created_at', '>=', $since)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get(['id', 'kind', 'amount', 'currency', 'description', 'created_at'])
                ->each(function (FinanceTransaction $tx) use ($items) {
                    $items->push([
                        'id' => "finance:{$tx->id}",
                        'category' => 'finance',
                        'type' => 'finance.transaction',
                        'title' => 'Movimiento financiero',
                        'message' => strtoupper($tx->kind).' · '.$tx->currency.' '.number_format((float) $tx->amount, 0, ',', '.')
                            .($tx->description ? " · {$tx->description}" : ''),
                        'href' => '/church/finance',
                        'occurred_at' => $tx->created_at?->toIso8601String(),
                    ]);
                });
        }

        return $items;
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function formationAdminItems(string $tenantId, Carbon $since): Collection
    {
        $items = collect();

        Course::query()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get(['id', 'title', 'status', 'created_at'])
            ->each(function (Course $c) use ($items) {
                $items->push([
                    'id' => "course:{$c->id}",
                    'category' => 'formation',
                    'type' => 'course.created',
                    'title' => 'Nuevo curso',
                    'message' => $c->title.' ('.$c->status.')',
                    'href' => '/courses',
                    'occurred_at' => $c->created_at?->toIso8601String(),
                ]);
            });

        Enrollment::query()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'created_at'])
            ->each(function (Enrollment $e) use ($items) {
                $items->push([
                    'id' => "enrollment:{$e->id}",
                    'category' => 'formation',
                    'type' => 'enrollment.created',
                    'title' => 'Nueva inscripción',
                    'message' => 'Un alumno se inscribió a un curso',
                    'href' => '/courses',
                    'occurred_at' => $e->created_at?->toIso8601String(),
                ]);
            });

        ClassSession::query()
            ->where('tenant_id', $tenantId)
            ->where('starts_at', '>=', now())
            ->where('starts_at', '<=', now()->addDays(7))
            ->orderBy('starts_at')
            ->limit(8)
            ->get(['id', 'title', 'starts_at'])
            ->each(function (ClassSession $c) use ($items) {
                $items->push([
                    'id' => "class-upcoming:{$c->id}",
                    'category' => 'formation',
                    'type' => 'class.upcoming',
                    'title' => 'Clase próxima',
                    'message' => $c->title.' · '.$c->starts_at?->format('d/m H:i'),
                    'href' => '/calendar',
                    'occurred_at' => now()->toIso8601String(),
                ]);
            });

        return $items;
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function formationStudentItems(string $tenantId, Carbon $since, string $userId): Collection
    {
        $items = collect();

        Enrollment::query()
            ->where('tenant_id', $tenantId)
            ->where('student_user_id', $userId)
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'created_at'])
            ->each(function (Enrollment $e) use ($items) {
                $items->push([
                    'id' => "enrollment:{$e->id}",
                    'category' => 'formation',
                    'type' => 'enrollment.created',
                    'title' => 'Inscripción confirmada',
                    'message' => 'Te inscribiste a un nuevo curso',
                    'href' => '/courses',
                    'occurred_at' => $e->created_at?->toIso8601String(),
                ]);
            });

        ClassSession::query()
            ->where('tenant_id', $tenantId)
            ->where('starts_at', '>=', now())
            ->where('starts_at', '<=', now()->addDays(7))
            ->orderBy('starts_at')
            ->limit(10)
            ->get(['id', 'title', 'starts_at'])
            ->each(function (ClassSession $c) use ($items) {
                $items->push([
                    'id' => "class-upcoming:{$c->id}",
                    'category' => 'formation',
                    'type' => 'class.upcoming',
                    'title' => 'Tu próxima clase',
                    'message' => $c->title.' · '.$c->starts_at?->format('d/m H:i'),
                    'href' => '/calendar',
                    'occurred_at' => now()->toIso8601String(),
                ]);
            });

        return $items;
    }
}
