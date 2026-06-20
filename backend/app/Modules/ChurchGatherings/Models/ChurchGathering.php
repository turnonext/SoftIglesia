<?php

namespace App\Modules\ChurchGatherings\Models;

use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ChurchGathering extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $table = 'church_gatherings';

    protected $fillable = [
        'tenant_id',
        'campus_id',
        'church_group_id',
        'title',
        'description',
        'type',
        'status',
        'starts_at',
        'ends_at',
        'location',
        'checkin_enabled',
        'checkin_token',
        'attendance_count',
        'volunteers_needed',
        'children_ministry_enabled',
        'notes',
        'recurrence_series_id',
        'recurrence_weekday',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'checkin_enabled' => 'boolean',
            'attendance_count' => 'integer',
            'volunteers_needed' => 'integer',
            'children_ministry_enabled' => 'boolean',
            'metrics' => 'array',
            'recurrence_weekday' => 'integer',
        ];
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(GatheringAttendance::class, 'church_gathering_id');
    }

    public static function generateCheckinToken(): string
    {
        return Str::lower(Str::random(32));
    }
}
