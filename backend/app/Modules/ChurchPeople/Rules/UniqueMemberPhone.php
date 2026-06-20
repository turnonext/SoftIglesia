<?php

namespace App\Modules\ChurchPeople\Rules;

use App\Modules\ChurchPeople\Services\MemberRegistrationService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueMemberPhone implements ValidationRule
{
    public function __construct(
        private readonly string $tenantId,
        private readonly ?string $ignoreMemberId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            return;
        }

        $service = app(MemberRegistrationService::class);

        if ($service->phoneExists($this->tenantId, $value, $this->ignoreMemberId)) {
            $fail('Este teléfono ya está registrado en la iglesia.');
        }
    }
}
