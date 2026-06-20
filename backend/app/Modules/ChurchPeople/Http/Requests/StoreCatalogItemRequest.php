<?php

namespace App\Modules\ChurchPeople\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCatalogItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'code' => ['nullable', 'string', 'max:8'],
        ];
    }
}
