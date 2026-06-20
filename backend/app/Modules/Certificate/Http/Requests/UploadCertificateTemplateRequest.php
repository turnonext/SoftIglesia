<?php

namespace App\Modules\Certificate\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadCertificateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:512', 'mimes:html,htm,txt', 'extensions:html,htm,txt'],
        ];
    }
}
