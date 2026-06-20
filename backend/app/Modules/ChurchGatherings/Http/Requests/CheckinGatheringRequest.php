<?php

namespace App\Modules\ChurchGatherings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckinGatheringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'instructor'], true);
    }

    public function rules(): array
    {
        return [
            'member_id' => ['nullable', 'string', 'max:26', 'required_without:guest_name'],
            'guest_name' => ['nullable', 'string', 'max:160', 'required_without:member_id'],
            'method' => ['nullable', 'in:qr,manual'],
        ];
    }
}
