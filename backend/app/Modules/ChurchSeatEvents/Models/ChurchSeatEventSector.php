<?php

namespace App\Modules\ChurchSeatEvents\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChurchSeatEventSector extends Model
{
    use BelongsToTenant, HasUlid;

    protected $table = 'church_seat_event_sectors';

    protected $fillable = [
        'tenant_id',
        'church_seat_event_id',
        'name',
        'row_count',
        'seats_per_row',
        'sort_order',
        'layout_placement',
    ];

    protected function casts(): array
    {
        return [
            'row_count' => 'integer',
            'seats_per_row' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(ChurchSeatEvent::class, 'church_seat_event_id');
    }

    public function seats(): HasMany
    {
        return $this->hasMany(ChurchSeatEventSeat::class, 'church_seat_event_sector_id')->orderBy('sort_order');
    }
}
