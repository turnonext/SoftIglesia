<?php

namespace App\Modules\ChurchSeatEvents\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChurchSeatEventSeat extends Model
{
    use BelongsToTenant, HasUlid;

    protected $table = 'church_seat_event_seats';

    protected $fillable = [
        'tenant_id',
        'church_seat_event_id',
        'church_seat_event_sector_id',
        'row_label',
        'seat_number',
        'label',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'seat_number' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(ChurchSeatEvent::class, 'church_seat_event_id');
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(ChurchSeatEventSector::class, 'church_seat_event_sector_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(ChurchSeatEventReservation::class, 'church_seat_event_seat_id');
    }

    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }
}
