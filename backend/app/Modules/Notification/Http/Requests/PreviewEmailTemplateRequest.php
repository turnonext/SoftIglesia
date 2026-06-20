<?php

namespace App\Modules\Notification\Http\Requests;

use App\Modules\Notification\Support\PlainTextSanitizer;
use Illuminate\Foundation\Http\FormRequest;

class PreviewEmailTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'subject' => ['nullable', 'string', 'max:'.PlainTextSanitizer::MAX_SUBJECT],
            'body_html' => ['nullable', 'string', 'max:12000'],
            'sample_variables' => ['nullable', 'array'],
            'sample_variables.*' => ['nullable', 'string', 'max:500'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('subject')) {
            $this->merge([
                'subject' => PlainTextSanitizer::limit((string) $this->input('subject'), PlainTextSanitizer::MAX_SUBJECT),
            ]);
        }

        if ($this->filled('body_html')) {
            $this->merge([
                'body_html' => PlainTextSanitizer::normalizeBodyHtml((string) $this->input('body_html')),
            ]);
        }
    }
}
