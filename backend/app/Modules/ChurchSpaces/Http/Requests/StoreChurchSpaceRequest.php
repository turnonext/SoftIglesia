<?php

namespace App\Modules\ChurchSpaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChurchSpaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'code' => ['nullable', 'string', 'max:32'],
            'campus_id' => ['nullable', 'string', 'max:26'],
            'building' => ['nullable', 'string', 'max:120'],
            'floor' => ['nullable', 'string', 'max:40'],
            'description' => ['nullable', 'string', 'max:5000'],
            'capacity' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'status' => ['nullable', 'in:available,maintenance,blocked'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:80'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'layout_x' => ['nullable', 'integer', 'min:0', 'max:48'],
            'layout_y' => ['nullable', 'integer', 'min:0', 'max:48'],
            'layout_w' => ['nullable', 'integer', 'min:1', 'max:12'],
            'layout_h' => ['nullable', 'integer', 'min:1', 'max:12'],
            'min_booking_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
            'max_booking_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
            'requires_approval' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
