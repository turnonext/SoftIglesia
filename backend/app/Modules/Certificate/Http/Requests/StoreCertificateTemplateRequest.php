<?php

namespace App\Modules\Certificate\Http\Requests;

use App\Modules\Certificate\Support\CertificateHtmlSanitizer;
use Illuminate\Foundation\Http\FormRequest;

class StoreCertificateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'key' => ['nullable', 'string', 'max:64', 'regex:/^[a-z0-9_-]+$/'],
            'body_html' => ['nullable', 'string'],
            'from_system_key' => ['nullable', 'string', 'in:classic,modern'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('body_html')) {
            $this->merge([
                'body_html' => CertificateHtmlSanitizer::sanitize((string) $this->input('body_html')),
            ]);
        }
    }
}
