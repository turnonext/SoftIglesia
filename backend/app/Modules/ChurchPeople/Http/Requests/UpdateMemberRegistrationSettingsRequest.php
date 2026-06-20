<?php



namespace App\Modules\ChurchPeople\Http\Requests;



use App\Modules\ChurchPeople\Services\MemberRegistrationService;

use Illuminate\Foundation\Http\FormRequest;

use Illuminate\Validation\Rule;



class UpdateMemberRegistrationSettingsRequest extends FormRequest

{

    public function authorize(): bool

    {

        return $this->user()?->role === 'admin';

    }



    public function rules(): array

    {

        return [

            'enabled' => ['sometimes', 'boolean'],

            'fields' => ['sometimes', 'array'],

            'fields.*' => ['string', Rule::in(MemberRegistrationService::OPTIONAL_FIELDS)],

        ];

    }

}


