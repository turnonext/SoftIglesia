<?php

namespace App\Modules\ChurchPeople\Models;

use App\Modules\ChurchGroups\Models\ChurchGroup;
use App\Modules\Shared\Traits\BelongsToTenant;
use App\Modules\Shared\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use BelongsToTenant, HasUlid, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'campus_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'birth_date',
        'gender',
        'marital_status',
        'status',
        'member_since',
        'visitor_since',
        'baptized_at',
        'discipleship_stage',
        'spiritual_status',
        'profession_id',
        'nationality_id',
        'church_group_id',
        'family_name',
        'address_line',
        'city',
        'state',
        'country',
        'postal_code',
        'notes',
        'last_attended_at',
        'metrics',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'member_since' => 'date',
            'visitor_since' => 'date',
            'baptized_at' => 'date',
            'last_attended_at' => 'datetime',
            'metrics' => 'array',
        ];
    }

    public function profession(): BelongsTo
    {
        return $this->belongsTo(Profession::class);
    }

    public function nationality(): BelongsTo
    {
        return $this->belongsTo(Nationality::class);
    }

    public function churchGroup(): BelongsTo
    {
        return $this->belongsTo(ChurchGroup::class, 'church_group_id');
    }

    public function timelineEvents(): HasMany
    {
        return $this->hasMany(MemberTimelineEvent::class)->orderByDesc('event_at');
    }
}
