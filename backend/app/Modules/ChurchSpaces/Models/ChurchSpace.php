<?php

namespace App\Modules\ChurchSpaces\Models;

use App\Modules\ChurchCampuses\Models\ChurchCampus;
use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChurchSpace extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'church_spaces';

    protected $fillable = [
        'tenant_id',
        'campus_id',
        'name',
        'code',
        'building',
        'floor',
        'layout_x',
        'layout_y',
        'layout_w',
        'layout_h',
        'description',
        'capacity',
        'status',
        'amenities',
        'color',
        'min_booking_minutes',
        'max_booking_minutes',
        'requires_approval',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amenities' => 'array',
            'requires_approval' => 'boolean',
            'capacity' => 'integer',
            'min_booking_minutes' => 'integer',
            'max_booking_minutes' => 'integer',
            'layout_x' => 'integer',
            'layout_y' => 'integer',
            'layout_w' => 'integer',
            'layout_h' => 'integer',
        ];
    }

    public function isOnFloorPlan(): bool
    {
        return $this->layout_x !== null && $this->layout_y !== null;
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(ChurchCampus::class, 'campus_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(ChurchSpaceReservation::class, 'church_space_id');
    }

    public function isBookable(): bool
    {
        return $this->status === 'available';
    }
}
