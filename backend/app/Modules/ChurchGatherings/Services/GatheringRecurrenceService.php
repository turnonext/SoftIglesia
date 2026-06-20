<?php

namespace App\Modules\ChurchGatherings\Services;

use App\Modules\ChurchGatherings\Models\ChurchGathering;
use Carbon\Carbon;
use Illuminate\Support\Str;

class GatheringRecurrenceService
{
    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $recurrence
     * @return array{first: ChurchGathering, count: int, series_id: string}
     */
    public function createWeeklySeries(array $payload, array $recurrence): array
    {
        $weekday = (int) $recurrence['weekday'];
        $weeks = min(52, max(1, (int) ($recurrence['weeks_ahead'] ?? 26)));
        $time = (string) $recurrence['time'];
        $durationMinutes = isset($recurrence['duration_minutes'])
            ? max(0, (int) $recurrence['duration_minutes'])
            : null;

        $seriesId = (string) Str::ulid();
        $checkinEnabled = $payload['checkin_enabled'] ?? true;

        $base = collect($payload)
            ->except(['recurrence', 'starts_at', 'ends_at'])
            ->all();

        $base['recurrence_series_id'] = $seriesId;
        $base['recurrence_weekday'] = $weekday;
        $base['type'] = $base['type'] ?? 'service';
        $base['status'] = $base['status'] ?? 'scheduled';
        $base['checkin_enabled'] = $checkinEnabled;

        $firstDate = $this->firstOccurrence($weekday, $time);
        $created = [];

        for ($i = 0; $i < $weeks; $i++) {
            $startsAt = $firstDate->copy()->addWeeks($i);
            $row = $base;
            $row['starts_at'] = $startsAt;
            $row['ends_at'] = $durationMinutes
                ? $startsAt->copy()->addMinutes($durationMinutes)
                : null;

            if ($checkinEnabled) {
                $row['checkin_token'] = ChurchGathering::generateCheckinToken();
            }

            $created[] = ChurchGathering::query()->create($row);
        }

        return [
            'first' => $created[0],
            'count' => count($created),
            'series_id' => $seriesId,
        ];
    }

    private function firstOccurrence(int $weekday, string $time): Carbon
    {
        [$hour, $minute] = array_map('intval', explode(':', $time));

        $date = Carbon::now()->startOfWeek(Carbon::SUNDAY)->addDays($weekday);
        $date->setTime($hour, $minute, 0);

        if ($date->lte(Carbon::now())) {
            $date->addWeek();
        }

        return $date;
    }
}
