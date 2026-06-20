<?php

namespace App\Modules\Course\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['instructor', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'subject_id' => ['nullable', 'ulid', 'exists:subjects,id'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
