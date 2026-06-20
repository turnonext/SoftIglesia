<?php

namespace App\Modules\ChurchGatherings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChurchGatheringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        $recurring = (bool) data_get($this->input('recurrence'), 'enabled');

        return [
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['nullable', 'in:service,event,cell_meeting,special'],
            'status' => ['nullable', 'in:scheduled,live,completed,cancelled'],
            'starts_at' => [Rule::requiredIf(! $recurring), 'nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'checkin_enabled' => ['nullable', 'boolean'],
            'volunteers_needed' => ['nullable', 'integer', 'min:0'],
            'children_ministry_enabled' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'campus_id' => ['nullable', 'string', 'max:26'],
            'church_group_id' => ['nullable', 'string', 'max:26'],
            'recurrence' => ['nullable', 'array'],
            'recurrence.enabled' => ['nullable', 'boolean'],
            'recurrence.weekday' => [Rule::requiredIf($recurring), 'integer', 'min:0', 'max:6'],
            'recurrence.time' => [Rule::requiredIf($recurring), 'date_format:H:i'],
            'recurrence.weeks_ahead' => ['nullable', 'integer', 'min:1', 'max:52'],
            'recurrence.duration_minutes' => ['nullable', 'integer', 'min:15', 'max:720'],
        ];
    }
}
