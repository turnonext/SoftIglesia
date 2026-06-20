<?php

namespace App\Modules\ChurchSpaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSpacesLayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    protected function prepareForValidation(): void
    {
        $layouts = collect($this->input('layouts', []))
            ->filter(fn ($item) => is_array($item) && filled($item['id'] ?? null))
            ->map(fn ($item) => [
                'id' => (string) $item['id'],
                'layout_x' => (int) round((float) ($item['layout_x'] ?? 0)),
                'layout_y' => (int) round((float) ($item['layout_y'] ?? 0)),
                'layout_w' => max(1, (int) round((float) ($item['layout_w'] ?? 1))),
                'layout_h' => max(1, (int) round((float) ($item['layout_h'] ?? 1))),
            ])
            ->values()
            ->all();

        $removedIds = collect($this->input('removed_ids', []))
            ->filter(fn ($id) => filled($id))
            ->map(fn ($id) => (string) $id)
            ->values()
            ->all();

        $this->merge([
            'layouts' => $layouts,
            'removed_ids' => $removedIds,
        ]);
    }

    public function rules(): array
    {
        return [
            'floor' => ['nullable', 'string', 'max:40'],
            'layouts' => ['present', 'array'],
            'layouts.*.id' => ['required', 'string', 'max:26'],
            'layouts.*.layout_x' => ['required', 'integer', 'min:0', 'max:48'],
            'layouts.*.layout_y' => ['required', 'integer', 'min:0', 'max:48'],
            'layouts.*.layout_w' => ['required', 'integer', 'min:1', 'max:12'],
            'layouts.*.layout_h' => ['required', 'integer', 'min:1', 'max:12'],
            'removed_ids' => ['nullable', 'array'],
            'removed_ids.*' => ['string', 'max:26'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $layouts = $this->input('layouts', []);
            $removed = $this->input('removed_ids', []);
            if (count($layouts) === 0 && count($removed) === 0) {
                $validator->errors()->add('layouts', 'Debe enviar al menos un espacio o un id a quitar del plano.');
            }
        });
    }
}
