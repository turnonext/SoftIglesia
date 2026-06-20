<?php

namespace App\Modules\ChurchSeatEvents\Models;

use App\Modules\ChurchSpaces\Models\ChurchSpace;
use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChurchSeatEvent extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'church_seat_events';

    protected $fillable = [
        'tenant_id',
        'church_space_id',
        'name',
        'description',
        'starts_at',
        'ends_at',
        'status',
        'reservations_paused',
        'reservation_token',
        'token_version',
        'hold_minutes',
        'max_reservations_per_user',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'reservations_paused' => 'boolean',
            'token_version' => 'integer',
            'hold_minutes' => 'integer',
            'max_reservations_per_user' => 'integer',
        ];
    }

    public function hasReservationLimit(): bool
    {
        return $this->max_reservations_per_user > 0;
    }

    public function space(): BelongsTo
    {
        return $this->belongsTo(ChurchSpace::class, 'church_space_id');
    }

    public function sectors(): HasMany
    {
        return $this->hasMany(ChurchSeatEventSector::class, 'church_seat_event_id')->orderBy('sort_order');
    }

    public function seats(): HasMany
    {
        return $this->hasMany(ChurchSeatEventSeat::class, 'church_seat_event_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(ChurchSeatEventReservation::class, 'church_seat_event_id');
    }

    public function isAcceptingReservations(): bool
    {
        if ($this->status !== 'active' || $this->reservations_paused) {
            return false;
        }

        $tz = config('app.church_timezone', 'America/Argentina/Buenos_Aires');
        $now = now()->timezone($tz);

        // Reservas abiertas mientras el evento no haya terminado (hora local iglesia).
        if ($this->ends_at !== null) {
            return $now->lessThan($this->ends_at->copy()->timezone($tz));
        }

        return $now->lessThan($this->starts_at->copy()->timezone($tz));
    }

    public function reservationClosedReason(): ?string
    {
        if ($this->status !== 'active') {
            return 'inactive';
        }

        if ($this->reservations_paused) {
            return 'paused';
        }

        if ($this->isAcceptingReservations()) {
            return null;
        }

        $tz = config('app.church_timezone', 'America/Argentina/Buenos_Aires');
        $now = now()->timezone($tz);
        $endsAt = $this->ends_at?->copy()->timezone($tz);
        $startsAt = $this->starts_at->copy()->timezone($tz);

        if ($endsAt !== null && $now->greaterThanOrEqualTo($endsAt)) {
            return 'ended';
        }

        if ($now->greaterThanOrEqualTo($startsAt)) {
            return 'started';
        }

        return 'closed';
    }
}
