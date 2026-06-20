<?php

namespace App\Modules\ChurchSpaces\Models;

use App\Modules\Auth\Models\User;
use App\Modules\ChurchMinistries\Models\ChurchMinistry;
use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class ChurchSpaceReservation extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'church_space_reservations';

    protected $fillable = [
        'tenant_id',
        'church_space_id',
        'user_id',
        'church_ministry_id',
        'title',
        'purpose',
        'starts_at',
        'ends_at',
        'attendees_count',
        'status',
        'notes',
        'recurrence_series_id',
        'recurrence_weekday',
        'recurrence_interval_weeks',
        'recurrence_time',
        'cancelled_at',
        'cancelled_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'attendees_count' => 'integer',
            'recurrence_weekday' => 'integer',
            'recurrence_interval_weeks' => 'integer',
        ];
    }

    public function space(): BelongsTo
    {
        return $this->belongsTo(ChurchSpace::class, 'church_space_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function ministry(): BelongsTo
    {
        return $this->belongsTo(ChurchMinistry::class, 'church_ministry_id');
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['pending', 'confirmed'], true);
    }

    public function isFixedSchedule(): bool
    {
        return $this->recurrence_weekday !== null;
    }

    public function occursOnDate(Carbon $date): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        if (! $this->isFixedSchedule()) {
            return $date->isSameDay($this->starts_at);
        }

        $tz = config('app.church_timezone', 'America/Argentina/Buenos_Aires');
        $dateInTz = $date->copy()->timezone($tz);

        if ((int) $dateInTz->dayOfWeek !== (int) $this->recurrence_weekday) {
            return false;
        }

        $anchor = $this->starts_at->copy()->timezone($tz)->startOfDay();
        $check = $dateInTz->copy()->startOfDay();

        if ($check->lt($anchor)) {
            return false;
        }

        $weeksDiff = (int) $anchor->diffInWeeks($check, absolute: true);
        $interval = max(1, (int) ($this->recurrence_interval_weeks ?? 1));

        return ($weeksDiff % $interval) === 0;
    }

    /**
     * @return array{starts_at: Carbon, ends_at: Carbon}|null
     */
    public function occurrenceOnDate(Carbon $date): ?array
    {
        if (! $this->occursOnDate($date)) {
            return null;
        }

        $tz = config('app.church_timezone', 'America/Argentina/Buenos_Aires');
        $wall = $this->starts_at->copy()->timezone($tz);
        $time = $this->recurrence_time ?? $wall->format('H:i');
        [$hour, $minute] = array_map('intval', explode(':', $time));

        $start = $date->copy()->timezone($tz)->setTime($hour, $minute, 0);
        $duration = (int) $this->starts_at->diffInMinutes($this->ends_at, absolute: true);
        $end = $start->copy()->addMinutes($duration);

        return [
            'starts_at' => $start,
            'ends_at' => $end,
        ];
    }

    public function overlapsRange(Carbon $rangeStart, Carbon $rangeEnd): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        if (! $this->isFixedSchedule()) {
            return $this->starts_at->lt($rangeEnd) && $this->ends_at->gt($rangeStart);
        }

        $cursor = $rangeStart->copy()->startOfDay()->subDays(7);
        $limit = $rangeEnd->copy()->startOfDay()->addDays(7);

        while ($cursor->lte($limit)) {
            $occurrence = $this->occurrenceOnDate($cursor);
            if ($occurrence !== null
                && $occurrence['starts_at']->lt($rangeEnd)
                && $occurrence['ends_at']->gt($rangeStart)
            ) {
                return true;
            }
            $cursor->addDay();
        }

        return false;
    }

    public function nextOccurrence(?Carbon $from = null): Carbon
    {
        $from = ($from ?? now())->copy();

        if (! $this->isFixedSchedule()) {
            return $this->starts_at->copy();
        }

        $cursor = $from->copy()->startOfDay();
        if ($cursor->lt($this->starts_at->copy()->startOfDay())) {
            $cursor = $this->starts_at->copy()->startOfDay();
        }

        for ($i = 0; $i < 800; $i++) {
            $occurrence = $this->occurrenceOnDate($cursor);
            if ($occurrence !== null && $occurrence['starts_at']->gte($from)) {
                return $occurrence['starts_at'];
            }
            $cursor->addDay();
        }

        return $this->starts_at->copy();
    }
}
