<?php

namespace App\Modules\ChurchSpaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChurchSpaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'code' => ['sometimes', 'nullable', 'string', 'max:32'],
            'campus_id' => ['sometimes', 'nullable', 'string', 'max:26'],
            'building' => ['sometimes', 'nullable', 'string', 'max:120'],
            'floor' => ['sometimes', 'nullable', 'string', 'max:40'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:5000'],
            'status' => ['sometimes', 'nullable', 'in:available,maintenance,blocked'],
            'amenities' => ['sometimes', 'nullable', 'array'],
            'amenities.*' => ['string', 'max:80'],
            'color' => ['sometimes', 'nullable', 'string', 'max:16'],
            'min_booking_minutes' => ['sometimes', 'nullable', 'integer', 'min:15', 'max:1440'],
            'max_booking_minutes' => ['sometimes', 'nullable', 'integer', 'min:15', 'max:1440'],
            'requires_approval' => ['sometimes', 'boolean'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
