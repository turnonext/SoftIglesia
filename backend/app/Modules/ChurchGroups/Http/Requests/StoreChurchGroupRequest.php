<?php

namespace App\Modules\ChurchGroups\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChurchGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['nullable', 'in:cell,ministry,youth,other'],
            'status' => ['nullable', 'in:active,inactive,paused'],
            'leader_name' => ['nullable', 'string', 'max:160'],
            'leader_phone' => ['nullable', 'string', 'max:40'],
            'leader_email' => ['nullable', 'email', 'max:180'],
            'leader_member_id' => ['nullable', 'string', 'max:26'],
            'co_leader_name' => ['nullable', 'string', 'max:160'],
            'co_leader_member_id' => ['nullable', 'string', 'max:26'],
            'meeting_day' => ['nullable', 'string', 'max:32'],
            'meeting_time' => ['nullable', 'string', 'max:16'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'member_count' => ['nullable', 'integer', 'min:0'],
            'weekly_topic' => ['nullable', 'string', 'max:255'],
            'campus_id' => ['nullable', 'string', 'max:26'],
        ];
    }
}
