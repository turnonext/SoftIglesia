<?php

namespace App\Modules\ChurchSpaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSpaceReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor', 'student'], true);
    }

    public function rules(): array
    {
        $recurring = filter_var($this->input('recurrence.enabled'), FILTER_VALIDATE_BOOLEAN);

        return [
            'church_space_id' => ['required', 'string', 'max:26'],
            'church_ministry_id' => ['required', 'string', 'max:26', 'exists:church_ministries,id'],
            'title' => ['required', 'string', 'max:200'],
            'purpose' => ['nullable', 'string', 'max:500'],
            'starts_at' => [$recurring ? 'nullable' : 'required', 'date'],
            'ends_at' => [$recurring ? 'nullable' : 'required', 'date', 'after:starts_at'],
            'attendees_count' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'recurrence' => ['nullable', 'array'],
            'recurrence.enabled' => ['nullable', 'boolean'],
            'recurrence.weekday' => ['required_if:recurrence.enabled,true', 'integer', 'min:0', 'max:6'],
            'recurrence.time' => ['required_if:recurrence.enabled,true', 'date_format:H:i'],
            'recurrence.interval_weeks' => ['nullable', 'integer', 'in:1,2'],
            'recurrence.weeks_ahead' => ['nullable', 'integer', 'min:1', 'max:52'],
            'recurrence.duration_minutes' => ['nullable', 'integer', 'min:15', 'max:720'],
        ];
    }
}
