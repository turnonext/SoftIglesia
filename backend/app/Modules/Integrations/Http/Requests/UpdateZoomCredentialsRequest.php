<?php

namespace App\Modules\Integrations\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateZoomCredentialsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'account_id' => ['required', 'string', 'max:128'],
            'client_id' => ['required', 'string', 'max:256'],
            'client_secret' => ['nullable', 'string', 'max:512'],
            'is_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
