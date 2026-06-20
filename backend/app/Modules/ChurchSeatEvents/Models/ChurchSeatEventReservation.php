<?php

namespace App\Modules\ChurchSeatEvents\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChurchSeatEventReservation extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'church_seat_event_reservations';

    protected $fillable = [
        'tenant_id',
        'church_seat_event_id',
        'church_seat_event_seat_id',
        'session_token',
        'attendee_name',
        'attendee_email',
        'attendee_phone',
        'status',
        'held_until',
        'confirmed_at',
        'confirmation_code',
    ];

    protected function casts(): array
    {
        return [
            'held_until' => 'datetime',
            'confirmed_at' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(ChurchSeatEvent::class, 'church_seat_event_id');
    }

    public function seat(): BelongsTo
    {
        return $this->belongsTo(ChurchSeatEventSeat::class, 'church_seat_event_seat_id');
    }

    public function isHeld(): bool
    {
        return $this->status === 'held'
            && $this->held_until !== null
            && $this->held_until->isFuture();
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }
}
