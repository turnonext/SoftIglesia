<?php

namespace App\Modules\ChurchPeople\Http\Requests;

use App\Modules\ChurchPeople\Rules\UniqueMemberPhone;
use App\Modules\ChurchPeople\Services\MemberRegistrationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    protected function prepareForValidation(): void
    {
        $service = app(MemberRegistrationService::class);

        if ($this->has('email')) {
            $this->merge(['email' => $service->normalizeEmail($this->input('email'))]);
        }
    }

    public function rules(): array
    {
        $tenantId = (string) ($this->user()?->tenant_id ?? app('current.tenant_id'));

        return [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => [
                'nullable',
                'email',
                'max:180',
                Rule::unique('members', 'email')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId)->whereNull('deleted_at')),
            ],
            'phone' => ['nullable', 'string', 'max:40', new UniqueMemberPhone($tenantId)],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:32'],
            'marital_status' => ['nullable', 'string', 'in:single,married,divorced,widowed,separated,civil_union'],
            'status' => ['nullable', 'in:visitor,member,inactive,moved'],
            'member_since' => ['nullable', 'date'],
            'visitor_since' => ['nullable', 'date'],
            'baptized_at' => ['nullable', 'date'],
            'discipleship_stage' => ['nullable', 'string', 'max:64'],
            'spiritual_status' => ['nullable', 'string', 'in:less_than_1,1_to_5,5_to_10,10_to_20,over_20'],
            'profession_id' => ['nullable', 'string', 'exists:professions,id'],
            'nationality_id' => ['nullable', 'string', 'exists:nationalities,id'],
            'church_group_id' => [
                'nullable',
                'string',
                Rule::exists('church_groups', 'id')->where(
                    fn ($q) => $q->where('tenant_id', $this->user()?->tenant_id)
                ),
            ],
            'family_name' => ['nullable', 'string', 'max:120'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:24'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'campus_id' => ['nullable', 'string', 'max:26'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Este correo ya está registrado en la iglesia.',
        ];
    }
}
