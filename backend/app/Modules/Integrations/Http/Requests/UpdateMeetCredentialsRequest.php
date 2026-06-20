<?php

namespace App\Modules\Integrations\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMeetCredentialsRequest extends FormRequest
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
            'client_id' => ['required', 'string', 'max:256'],
            'client_secret' => ['nullable', 'string', 'max:512'],
            'refresh_token' => ['nullable', 'string', 'max:2048'],
            'calendar_id' => ['nullable', 'string', 'max:256'],
            'is_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
