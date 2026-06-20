<?php

namespace App\Modules\ChurchSpaces\Services;

use App\Modules\ChurchSpaces\Models\ChurchSpace;
use App\Modules\ChurchSpaces\Models\ChurchSpaceReservation;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class SpaceReservationService
{
    /**
     * @return array<int, ChurchSpaceReservation>
     */
    public function activeReservationsForDate(ChurchSpace $space, Carbon $date): array
    {
        $reservations = ChurchSpaceReservation::query()
            ->where('church_space_id', $space->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('starts_at')
            ->get();

        $active = [];

        foreach ($reservations as $reservation) {
            if ($reservation->isFixedSchedule()) {
                if ($reservation->occursOnDate($date)) {
                    $active[] = $reservation;
                }
                continue;
            }

            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();
            if ($reservation->starts_at->lt($dayEnd) && $reservation->ends_at->gt($dayStart)) {
                $active[] = $reservation;
            }
        }

        return $active;
    }

    public function hasConflict(
        string $spaceId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?string $excludeReservationId = null
    ): bool {
        $reservations = ChurchSpaceReservation::query()
            ->where('church_space_id', $spaceId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->when($excludeReservationId, fn ($q) => $q->where('id', '!=', $excludeReservationId))
            ->get();

        foreach ($reservations as $reservation) {
            if ($reservation->overlapsRange($startsAt, $endsAt)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int, array{start: string, end: string, available: bool, reservation_id: string|null}>
     */
    public function buildDaySlots(ChurchSpace $space, Carbon $date, int $slotMinutes = 30): array
    {
        $reservations = $this->activeReservationsForDate($space, $date);
        $day = $date->copy()->startOfDay();
        $open = $day->copy()->setTime(7, 0);
        $close = $day->copy()->setTime(23, 0);
        $slots = [];

        for ($cursor = $open->copy(); $cursor->lt($close); $cursor->addMinutes($slotMinutes)) {
            $slotEnd = $cursor->copy()->addMinutes($slotMinutes);
            $overlap = null;

            foreach ($reservations as $reservation) {
                $occurrence = $reservation->isFixedSchedule()
                    ? $reservation->occurrenceOnDate($date)
                    : [
                        'starts_at' => $reservation->starts_at,
                        'ends_at' => $reservation->ends_at,
                    ];

                if ($occurrence === null) {
                    continue;
                }

                if ($occurrence['starts_at']->lt($slotEnd) && $occurrence['ends_at']->gt($cursor)) {
                    $overlap = $reservation;
                    break;
                }
            }

            $slots[] = [
                'start' => $cursor->toIso8601String(),
                'end' => $slotEnd->toIso8601String(),
                'available' => $overlap === null && $space->isBookable(),
                'reservation_id' => $overlap?->id,
            ];
        }

        return $slots;
    }

    public function assertCanBook(
        ChurchSpace $space,
        Carbon $startsAt,
        Carbon $endsAt,
        int $attendeesCount,
        ?string $excludeReservationId = null
    ): void {
        if (! $space->isBookable()) {
            throw ValidationException::withMessages([
                'church_space_id' => ['El espacio no está disponible para reservas (estado: '.$space->status.').'],
            ]);
        }

        if ($endsAt->lte($startsAt)) {
            throw ValidationException::withMessages([
                'ends_at' => ['La hora de fin debe ser posterior al inicio.'],
            ]);
        }

        $durationMinutes = (int) $startsAt->diffInMinutes($endsAt, absolute: true);
        if ($durationMinutes < $space->min_booking_minutes) {
            throw ValidationException::withMessages([
                'ends_at' => ["La reserva mínima es de {$space->min_booking_minutes} minutos."],
            ]);
        }

        if ($durationMinutes > $space->max_booking_minutes) {
            throw ValidationException::withMessages([
                'ends_at' => ["La reserva máxima es de {$space->max_booking_minutes} minutos."],
            ]);
        }

        if ($space->capacity > 0 && $attendeesCount > $space->capacity) {
            throw ValidationException::withMessages([
                'attendees_count' => ["La capacidad del espacio es de {$space->capacity} personas."],
            ]);
        }

        if ($this->hasConflict($space->id, $startsAt, $endsAt, $excludeReservationId)) {
            throw ValidationException::withMessages([
                'starts_at' => ['Ya existe una reserva en ese horario. Elegí otro intervalo.'],
            ]);
        }
    }

    public function initialStatus(ChurchSpace $space): string
    {
        return $space->requires_approval ? 'pending' : 'confirmed';
    }

    public function activeReservationCount(string $spaceId): int
    {
        return ChurchSpaceReservation::query()
            ->where('church_space_id', $spaceId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listFixedSchedules(Carbon $forDate): array
    {
        $fixed = ChurchSpaceReservation::query()
            ->whereNotNull('recurrence_weekday')
            ->whereIn('status', ['pending', 'confirmed'])
            ->with(['space:id,name,code,color', 'ministry:id,name'])
            ->orderBy('recurrence_weekday')
            ->orderBy('starts_at')
            ->get();

        $schedules = [];

        foreach ($fixed as $reservation) {
            $next = $reservation->nextOccurrence(now());
            $nextEnd = $next->copy()->addMinutes(
                (int) $reservation->starts_at->diffInMinutes($reservation->ends_at, absolute: true)
            );
            $onDate = $reservation->occurrenceOnDate($forDate);

            $schedules[] = [
                'series_id' => $reservation->recurrence_series_id ?? $reservation->id,
                'title' => $reservation->title,
                'purpose' => $reservation->purpose,
                'church_space_id' => $reservation->church_space_id,
                'church_ministry_id' => $reservation->church_ministry_id,
                'ministry' => $reservation->ministry ? [
                    'id' => $reservation->ministry->id,
                    'name' => $reservation->ministry->name,
                ] : null,
                'space' => $reservation->space ? [
                    'id' => $reservation->space->id,
                    'name' => $reservation->space->name,
                    'code' => $reservation->space->code,
                    'color' => $reservation->space->color,
                ] : null,
                'recurrence_weekday' => $reservation->recurrence_weekday,
                'recurrence_interval_weeks' => $reservation->recurrence_interval_weeks ?? 1,
                'time' => $reservation->recurrence_time ?? $reservation->starts_at->format('H:i'),
                'duration_minutes' => (int) $reservation->starts_at->diffInMinutes($reservation->ends_at, absolute: true),
                'status' => $reservation->status,
                'next_starts_at' => $next->toIso8601String(),
                'next_ends_at' => $nextEnd->toIso8601String(),
                'occurs_on_date' => $onDate !== null,
                'occurrence_on_date' => $onDate ? [
                    'id' => $reservation->id,
                    'starts_at' => $onDate['starts_at']->toIso8601String(),
                    'ends_at' => $onDate['ends_at']->toIso8601String(),
                    'status' => $reservation->status,
                ] : null,
            ];
        }

        usort($schedules, function (array $a, array $b) {
            $dayCmp = ($a['recurrence_weekday'] ?? 0) <=> ($b['recurrence_weekday'] ?? 0);
            if ($dayCmp !== 0) {
                return $dayCmp;
            }

            return strcmp($a['time'] ?? '', $b['time'] ?? '');
        });

        return $schedules;
    }
}
