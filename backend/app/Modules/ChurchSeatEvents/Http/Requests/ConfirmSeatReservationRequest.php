<?php

namespace App\Modules\ChurchSeatEvents\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmSeatReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'session_token' => ['required', 'string', 'max:64'],
            'seat_id' => ['required', 'string'],
            'attendee_name' => ['required', 'string', 'max:160'],
            'attendee_email' => ['required', 'email', 'max:200'],
            'attendee_phone' => ['nullable', 'string', 'max:40'],
            'captcha_id' => ['required', 'string', 'max:64'],
            'captcha_answer' => ['required', 'integer'],
        ];
    }
}
