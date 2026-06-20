<?php

namespace App\Modules\Certificate\Http\Requests;

use App\Modules\Certificate\Support\CertificateHtmlSanitizer;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCertificateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'body_html' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
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
