<?php



namespace App\Modules\ChurchPeople\Http\Requests;



use App\Modules\ChurchPeople\Rules\UniqueMemberPhone;

use App\Modules\ChurchPeople\Services\MemberRegistrationService;

use App\Modules\Shared\Models\Tenant;

use Illuminate\Foundation\Http\FormRequest;

use Illuminate\Validation\Rule;



class StorePublicMemberRequest extends FormRequest

{

    public function authorize(): bool

    {

        return true;

    }



    protected function prepareForValidation(): void

    {

        $service = app(MemberRegistrationService::class);



        $this->merge([

            'email' => $service->normalizeEmail($this->input('email')),

            'phone' => $this->input('phone') !== null && trim((string) $this->input('phone')) !== ''

                ? trim((string) $this->input('phone'))

                : null,

        ]);

    }



    public function rules(): array

    {

        /** @var Tenant $tenant */

        $tenant = app('current.tenant');

        $service = app(MemberRegistrationService::class);

        $tenantId = (string) app('current.tenant_id');



        $rules = [

            'tenant_slug' => ['required', 'string', 'max:64'],

            'token' => ['required', 'string', 'min:16'],

            'first_name' => ['required', 'string', 'max:120'],

            'last_name' => ['required', 'string', 'max:120'],

            'email' => [

                'required',

                'email',

                'max:180',

                Rule::unique('members', 'email')

                    ->where(fn ($q) => $q->where('tenant_id', $tenantId)->whereNull('deleted_at')),

            ],

            'phone' => ['required', 'string', 'max:40', new UniqueMemberPhone($tenantId)],

        ];



        foreach ($service->enabledFields($tenant) as $field) {

            $rules = array_merge($rules, $service->optionalFieldRules($field));

        }



        return $rules;

    }



    public function messages(): array

    {

        return [

            'first_name.required' => 'El nombre es obligatorio.',

            'last_name.required' => 'El apellido es obligatorio.',

            'email.required' => 'El correo es obligatorio.',

            'email.unique' => 'Este correo ya está registrado en la iglesia.',

            'phone.required' => 'El teléfono es obligatorio.',

            'token.required' => 'El enlace de registro no es válido.',

        ];

    }

}


