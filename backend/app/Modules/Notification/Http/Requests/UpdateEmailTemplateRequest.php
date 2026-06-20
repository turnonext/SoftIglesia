<?php

namespace App\Modules\Notification\Http\Requests;

use App\Modules\Notification\Support\PlainTextSanitizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateEmailTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'subject' => ['sometimes', 'string', 'max:'.PlainTextSanitizer::MAX_SUBJECT],
            'body_html' => ['sometimes', 'string', 'max:12000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if (! $this->has('body_html')) {
                return;
            }

            $body = (string) $this->input('body_html');
            if (! str_starts_with(trim($body), '{')) {
                return;
            }

            $decoded = json_decode($body, true);
            if (! is_array($decoded) || ($decoded['v'] ?? null) !== 2) {
                return;
            }

            $message = (string) ($decoded['message'] ?? '');
            if (mb_strlen($message) > PlainTextSanitizer::MAX_TEXTAREA) {
                $v->errors()->add('body_html', 'El mensaje no puede superar '.PlainTextSanitizer::MAX_TEXTAREA.' caracteres.');
            }

            $note = (string) ($decoded['note'] ?? '');
            if ($note !== '' && mb_strlen($note) > PlainTextSanitizer::MAX_TEXTAREA) {
                $v->errors()->add('body_html', 'La nota al pie no puede superar '.PlainTextSanitizer::MAX_TEXTAREA.' caracteres.');
            }

            $label = is_array($decoded['button'] ?? null)
                ? (string) ($decoded['button']['label'] ?? '')
                : '';
            if ($label !== '' && mb_strlen($label) > PlainTextSanitizer::MAX_BUTTON_LABEL) {
                $v->errors()->add('body_html', 'El texto del botón no puede superar '.PlainTextSanitizer::MAX_BUTTON_LABEL.' caracteres.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('subject')) {
            $this->merge([
                'subject' => PlainTextSanitizer::limit((string) $this->input('subject'), PlainTextSanitizer::MAX_SUBJECT),
            ]);
        }

        if ($this->has('body_html')) {
            $this->merge([
                'body_html' => PlainTextSanitizer::normalizeBodyHtml((string) $this->input('body_html')),
            ]);
        }
    }
}
