<?php

namespace App\Modules\ChurchSpaces\Services;

use App\Modules\Auth\Models\User;
use App\Modules\ChurchSpaces\Models\ChurchSpace;
use App\Modules\ChurchSpaces\Models\ChurchSpaceReservation;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class SpaceReservationRecurrenceService
{
    public function __construct(private readonly SpaceReservationService $reservations) {}

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $recurrence
     * @return array{reservation: ChurchSpaceReservation, series_id: string}
     */
    public function createFixedSchedule(
        array $payload,
        array $recurrence,
        User $user,
        ChurchSpace $space
    ): array {
        $weekday = (int) $recurrence['weekday'];
        $intervalWeeks = (int) ($recurrence['interval_weeks'] ?? 1);
        if (! in_array($intervalWeeks, [1, 2], true)) {
            $intervalWeeks = 1;
        }

        $time = (string) $recurrence['time'];
        $durationMinutes = max(15, (int) ($recurrence['duration_minutes'] ?? 120));
        $attendees = (int) ($payload['attendees_count'] ?? 1);

        $startsAt = $this->firstOccurrence($weekday, $time);
        $endsAt = $startsAt->copy()->addMinutes($durationMinutes);

        $this->assertNoDuplicateFixedSchedule($space->id, $weekday, $intervalWeeks, $startsAt, $endsAt);
        $this->reservations->assertCanBook($space, $startsAt, $endsAt, $attendees);

        $status = $this->reservations->initialStatus($space);

        $reservation = ChurchSpaceReservation::query()->create([
            'church_space_id' => $space->id,
            'user_id' => $user->id,
            'church_ministry_id' => $payload['church_ministry_id'] ?? null,
            'title' => $payload['title'],
            'purpose' => $payload['purpose'] ?? null,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'attendees_count' => $attendees,
            'status' => $status,
            'notes' => $payload['notes'] ?? null,
            'recurrence_weekday' => $weekday,
            'recurrence_interval_weeks' => $intervalWeeks,
            'recurrence_time' => substr($time, 0, 5),
        ]);

        $reservation->recurrence_series_id = $reservation->id;
        $reservation->save();

        return [
            'reservation' => $reservation->fresh(),
            'series_id' => $reservation->id,
        ];
    }

    public function cancelFixedSchedule(string $seriesId, User $user, bool $isManager): bool
    {
        $query = ChurchSpaceReservation::query()
            ->where(function ($q) use ($seriesId) {
                $q->where('id', $seriesId)->orWhere('recurrence_series_id', $seriesId);
            })
            ->whereNotNull('recurrence_weekday')
            ->whereIn('status', ['pending', 'confirmed']);

        if (! $isManager) {
            $query->where('user_id', $user->id);
        }

        $reservation = $query->first();
        if ($reservation === null) {
            return false;
        }

        $reservation->status = 'cancelled';
        $reservation->cancelled_at = now();
        $reservation->cancelled_by = $user->id;
        $reservation->save();

        return true;
    }

    private function assertNoDuplicateFixedSchedule(
        string $spaceId,
        int $weekday,
        int $intervalWeeks,
        Carbon $startsAt,
        Carbon $endsAt
    ): void {
        $existing = ChurchSpaceReservation::query()
            ->where('church_space_id', $spaceId)
            ->whereNotNull('recurrence_weekday')
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('recurrence_weekday', $weekday)
            ->get();

        foreach ($existing as $fixed) {
            if ($fixed->overlapsRange($startsAt, $endsAt)) {
                throw ValidationException::withMessages([
                    'recurrence' => ['Ya existe un horario fijo en ese espacio y día con horario superpuesto.'],
                ]);
            }
        }
    }

    private function firstOccurrence(int $weekday, string $time): Carbon
    {
        [$hour, $minute] = array_map('intval', explode(':', $time));
        $tz = config('app.church_timezone', 'America/Argentina/Buenos_Aires');

        $anchor = Carbon::now($tz)->startOfWeek(Carbon::SUNDAY)->addDays($weekday);
        if ($anchor->lte(Carbon::now($tz))) {
            $anchor->addWeek();
        }

        return Carbon::create(
            (int) $anchor->year,
            (int) $anchor->month,
            (int) $anchor->day,
            $hour,
            $minute,
            0,
            $tz
        )->utc();
    }
}
