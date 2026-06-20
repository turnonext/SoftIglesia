<?php



namespace App\Modules\ChurchSpaces\Http\Requests;



use Illuminate\Foundation\Http\FormRequest;



class UpdateSpaceAppearanceRequest extends FormRequest

{

    public function authorize(): bool

    {

        return in_array($this->user()?->role, ['admin', 'instructor'], true);

    }



    public function rules(): array

    {

        return [

            'name' => ['sometimes', 'required', 'string', 'max:160'],

            'color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],

        ];

    }

}


