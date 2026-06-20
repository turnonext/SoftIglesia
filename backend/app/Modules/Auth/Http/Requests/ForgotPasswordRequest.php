<?php

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_slug' => ['required', 'string', 'max:64'],
            'email' => ['required', 'email', 'max:255'],
        ];
    }
}
