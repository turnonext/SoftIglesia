<?php

namespace App\Modules\ChurchGatherings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChurchGatheringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'type' => ['sometimes', 'nullable', 'in:service,event,cell_meeting,special'],
            'status' => ['sometimes', 'nullable', 'in:scheduled,live,completed,cancelled'],
            'starts_at' => ['sometimes', 'required', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'checkin_enabled' => ['sometimes', 'nullable', 'boolean'],
            'volunteers_needed' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'children_ministry_enabled' => ['sometimes', 'nullable', 'boolean'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'campus_id' => ['sometimes', 'nullable', 'string', 'max:26'],
            'church_group_id' => ['sometimes', 'nullable', 'string', 'max:26'],
        ];
    }
}
