<?php

namespace App\Modules\ChurchGroups\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChurchGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'type' => ['sometimes', 'nullable', 'in:cell,ministry,youth,other'],
            'status' => ['sometimes', 'nullable', 'in:active,inactive,paused'],
            'leader_name' => ['sometimes', 'nullable', 'string', 'max:160'],
            'leader_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'leader_email' => ['sometimes', 'nullable', 'email', 'max:180'],
            'leader_member_id' => ['sometimes', 'nullable', 'string', 'max:26'],
            'co_leader_name' => ['sometimes', 'nullable', 'string', 'max:160'],
            'co_leader_member_id' => ['sometimes', 'nullable', 'string', 'max:26'],
            'meeting_day' => ['sometimes', 'nullable', 'string', 'max:32'],
            'meeting_time' => ['sometimes', 'nullable', 'string', 'max:16'],
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'member_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'weekly_topic' => ['sometimes', 'nullable', 'string', 'max:255'],
            'campus_id' => ['sometimes', 'nullable', 'string', 'max:26'],
        ];
    }
}
