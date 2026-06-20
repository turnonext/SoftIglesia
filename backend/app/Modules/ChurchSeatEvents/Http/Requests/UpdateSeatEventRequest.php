<?php

namespace App\Modules\ChurchSeatEvents\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSeatEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'church_space_id' => ['nullable', 'string', 'exists:church_spaces,id'],
            'status' => ['sometimes', 'in:active,paused,finished'],
            'hold_minutes' => ['sometimes', 'integer', 'min:1', 'max:30'],
            'max_reservations_per_user' => ['sometimes', 'integer', 'min:0', 'max:50'],
            'sectors' => ['sometimes', 'array', 'min:1'],
            'sectors.*.name' => ['required_with:sectors', 'string', 'max:80'],
            'sectors.*.row_count' => ['required_with:sectors', 'integer', 'min:1', 'max:100'],
            'sectors.*.seats_per_row' => ['required_with:sectors', 'integer', 'min:1', 'max:200'],
            'sectors.*.layout_placement' => ['nullable', 'in:below,right'],
        ];
    }
}
