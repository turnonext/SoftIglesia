<?php

namespace App\Modules\Shared\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTenantSettingsRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'branding' => ['sometimes', 'array'],
            'branding.primary' => ['sometimes', 'string', 'max:7'],
            'branding.primary_hover' => ['sometimes', 'string', 'max:7'],
            'branding.accent' => ['sometimes', 'string', 'max:7'],
            'branding.sidebar' => ['sometimes', 'string', 'max:7'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $branding = $this->input('branding');
            if (! is_array($branding)) {
                return;
            }

            foreach (['primary', 'primary_hover', 'accent', 'sidebar'] as $key) {
                $value = $branding[$key] ?? null;
                if ($value === null || $value === '') {
                    continue;
                }
                if (! preg_match('/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/', (string) $value)) {
                    $validator->errors()->add("branding.{$key}", 'Color inválido (use formato #RRGGBB).');
                }
            }
        });
    }
}
