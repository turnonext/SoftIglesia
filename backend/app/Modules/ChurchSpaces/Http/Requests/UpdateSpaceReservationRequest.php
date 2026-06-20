<?php

namespace App\Modules\ChurchSpaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSpaceReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor', 'student'], true);
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'church_ministry_id' => ['sometimes', 'required', 'string', 'max:26', 'exists:church_ministries,id'],
            'purpose' => ['sometimes', 'nullable', 'string', 'max:500'],
            'starts_at' => ['sometimes', 'required', 'date'],
            'ends_at' => ['sometimes', 'required', 'date', 'after:starts_at'],
            'attendees_count' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:5000'],
            'status' => ['sometimes', 'in:pending,confirmed,cancelled'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
