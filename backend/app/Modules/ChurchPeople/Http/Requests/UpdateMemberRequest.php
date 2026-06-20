<?php

namespace App\Modules\ChurchPeople\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:120'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'email' => ['sometimes', 'nullable', 'email', 'max:180'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'birth_date' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:32'],
            'marital_status' => ['sometimes', 'nullable', 'string', 'in:single,married,divorced,widowed,separated,civil_union'],
            'status' => ['sometimes', 'nullable', 'in:visitor,member,inactive,moved'],
            'member_since' => ['sometimes', 'nullable', 'date'],
            'visitor_since' => ['sometimes', 'nullable', 'date'],
            'baptized_at' => ['sometimes', 'nullable', 'date'],
            'discipleship_stage' => ['sometimes', 'nullable', 'string', 'max:64'],
            'spiritual_status' => ['sometimes', 'nullable', 'string', 'in:less_than_1,1_to_5,5_to_10,10_to_20,over_20'],
            'profession_id' => ['sometimes', 'nullable', 'string', 'exists:professions,id'],
            'nationality_id' => ['sometimes', 'nullable', 'string', 'exists:nationalities,id'],
            'church_group_id' => [
                'sometimes',
                'nullable',
                'string',
                Rule::exists('church_groups', 'id')->where(
                    fn ($q) => $q->where('tenant_id', $this->user()?->tenant_id)
                ),
            ],
            'family_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'state' => ['sometimes', 'nullable', 'string', 'max:120'],
            'country' => ['sometimes', 'nullable', 'string', 'max:120'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:24'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'campus_id' => ['sometimes', 'nullable', 'string', 'max:26'],
            'last_attended_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
