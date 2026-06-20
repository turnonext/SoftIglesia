<?php

namespace App\Modules\User\Http\Requests;

use App\Modules\Auth\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTenantUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'role' => ['sometimes', Rule::in(['student', 'instructor'])],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($v->errors()->isNotEmpty()) {
                return;
            }

            if (! $this->has('role') && ! $this->has('is_active')) {
                $v->errors()->add('user', 'Indica rol o estado activo.');

                return;
            }

            /** @var User|null $target */
            $target = $this->route('user');
            $actor = $this->user();

            if (! $target || ! $actor) {
                return;
            }

            if ($target->tenant_id !== $actor->tenant_id) {
                $v->errors()->add('user', 'Usuario fuera de tu organización.');

                return;
            }

            if ($target->id === $actor->id) {
                $v->errors()->add('user', 'No puedes modificar tu propia cuenta desde aquí.');

                return;
            }

            if ($target->role === 'admin') {
                $v->errors()->add('role', 'No se puede modificar un administrador.');

                return;
            }

            if ($this->has('role') && ! in_array($target->role, ['student', 'instructor'], true)) {
                $v->errors()->add('role', 'Solo puedes asignar rol estudiante o profesor.');
            }
        });
    }
}
