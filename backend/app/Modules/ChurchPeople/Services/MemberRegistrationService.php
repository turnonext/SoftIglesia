<?php

namespace App\Modules\ChurchPeople\Services;

use App\Modules\ChurchPeople\Models\Member;
use App\Modules\Shared\Models\Tenant;
use App\Modules\Shared\Services\TenantBrandingService;
use Illuminate\Support\Str;

class MemberRegistrationService
{
    public const REQUIRED_FIELDS = [
        'first_name',
        'last_name',
        'email',
        'phone',
    ];

    public const OPTIONAL_FIELDS = [
        'birth_date',
        'family_name',
        'marital_status',
        'spiritual_status',
        'profession_id',
        'nationality_id',
        'city',
        'address_line',
    ];

    public function __construct(
        private readonly TenantBrandingService $branding,
    ) {}

    /** @return array{enabled: bool, token: string|null, fields: list<string>, required_fields: list<string>, optional_fields: list<string>} */
    public function settings(Tenant $tenant): array
    {
        $reg = $this->registrationSettings($tenant);

        return [
            'enabled' => (bool) ($reg['enabled'] ?? false),
            'token' => $reg['token'] ?? null,
            'fields' => $this->enabledFields($tenant),
            'required_fields' => self::REQUIRED_FIELDS,
            'optional_fields' => self::OPTIONAL_FIELDS,
        ];
    }

    /** @return list<string> */
    public function defaultOptionalFields(): array
    {
        return self::OPTIONAL_FIELDS;
    }

    /** @return list<string> */
    public function enabledFields(Tenant $tenant): array
    {
        $reg = $this->registrationSettings($tenant);
        $fields = $reg['fields'] ?? $this->defaultOptionalFields();

        return array_values(array_intersect($fields, self::OPTIONAL_FIELDS));
    }

    /** @param  list<string>|null  $fields */
    public function normalizeFieldsInput(?array $fields): array
    {
        if ($fields === null) {
            return $this->defaultOptionalFields();
        }

        return array_values(array_unique(array_intersect($fields, self::OPTIONAL_FIELDS)));
    }

    /** @return array<string, list<string>> */
    public function optionalFieldRules(string $field): array
    {
        return match ($field) {
            'birth_date' => ['birth_date' => ['nullable', 'date']],
            'family_name' => ['family_name' => ['nullable', 'string', 'max:120']],
            'marital_status' => ['marital_status' => ['nullable', 'string', 'in:single,married,divorced,widowed,separated,civil_union']],
            'spiritual_status' => ['spiritual_status' => ['nullable', 'string', 'in:less_than_1,1_to_5,5_to_10,10_to_20,over_20']],
            'profession_id' => ['profession_id' => ['nullable', 'string', 'exists:professions,id']],
            'nationality_id' => ['nationality_id' => ['nullable', 'string', 'exists:nationalities,id']],
            'city' => ['city' => ['nullable', 'string', 'max:120']],
            'address_line' => ['address_line' => ['nullable', 'string', 'max:255']],
            default => [],
        };
    }

    /** @param  array<string, mixed>  $payload */
    public function filterPublicPayload(Tenant $tenant, array $payload): array
    {
        $allowed = array_merge(self::REQUIRED_FIELDS, $this->enabledFields($tenant));

        return array_intersect_key($payload, array_flip($allowed));
    }

    public function ensureToken(Tenant $tenant): string
    {
        $settings = $tenant->settings ?? [];
        $reg = $settings['member_registration'] ?? [];

        if (empty($reg['token'])) {
            $reg['token'] = Str::random(48);
            $settings['member_registration'] = $reg;
            $tenant->settings = $settings;
            $tenant->save();
        }

        return $settings['member_registration']['token'];
    }

    /** @param  array{enabled?: bool, fields?: list<string>|null}  $input */
    public function updateSettings(Tenant $tenant, array $input): Tenant
    {
        $settings = $tenant->settings ?? [];
        $reg = $settings['member_registration'] ?? [];

        if (array_key_exists('enabled', $input)) {
            $reg['enabled'] = (bool) $input['enabled'];
        }

        if (array_key_exists('fields', $input)) {
            $reg['fields'] = $this->normalizeFieldsInput($input['fields']);
        } elseif (! isset($reg['fields'])) {
            $reg['fields'] = $this->defaultOptionalFields();
        }

        if (empty($reg['token'])) {
            $reg['token'] = Str::random(48);
        }

        $settings['member_registration'] = $reg;
        $tenant->settings = $settings;
        $tenant->save();

        return $tenant->fresh();
    }

    public function regenerateToken(Tenant $tenant): string
    {
        $settings = $tenant->settings ?? [];
        $reg = $settings['member_registration'] ?? [];
        $reg['token'] = Str::random(48);
        $settings['member_registration'] = $reg;
        $tenant->settings = $settings;
        $tenant->save();

        return $reg['token'];
    }

    public function validateAccess(Tenant $tenant, string $token): bool
    {
        $reg = $this->registrationSettings($tenant);

        if (! ($reg['enabled'] ?? false)) {
            return false;
        }

        $stored = (string) ($reg['token'] ?? '');

        return $stored !== '' && hash_equals($stored, $token);
    }

    public function resolveTenant(?string $slug): ?Tenant
    {
        if (! $slug) {
            return null;
        }

        return Tenant::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }

    /** @return array<string, mixed> */
    public function publicConfig(Tenant $tenant): array
    {
        return array_merge($this->branding->present($tenant), [
            'registration_enabled' => (bool) ($this->registrationSettings($tenant)['enabled'] ?? false),
            'fields' => $this->enabledFields($tenant),
            'required_fields' => self::REQUIRED_FIELDS,
        ]);
    }

    public function registerUrl(Tenant $tenant, string $token): string
    {
        $base = config('lms.frontend_url', 'http://localhost:3000');

        return "{$base}/register/member?tenant={$tenant->slug}&token={$token}";
    }

    public function normalizeEmail(?string $email): ?string
    {
        if ($email === null || trim($email) === '') {
            return null;
        }

        return strtolower(trim($email));
    }

    public function normalizePhone(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        return $digits !== '' ? $digits : null;
    }

    public function emailExists(string $tenantId, ?string $email, ?string $ignoreMemberId = null): bool
    {
        $normalized = $this->normalizeEmail($email);

        if (! $normalized) {
            return false;
        }

        return Member::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->when($ignoreMemberId, fn ($q) => $q->where('id', '!=', $ignoreMemberId))
            ->whereRaw('LOWER(TRIM(email)) = ?', [$normalized])
            ->exists();
    }

    public function phoneExists(string $tenantId, ?string $phone, ?string $ignoreMemberId = null): bool
    {
        $normalized = $this->normalizePhone($phone);

        if (! $normalized) {
            return false;
        }

        return Member::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->when($ignoreMemberId, fn ($q) => $q->where('id', '!=', $ignoreMemberId))
            ->whereNotNull('phone')
            ->get(['id', 'phone'])
            ->contains(fn (Member $member) => $this->normalizePhone($member->phone) === $normalized);
    }

    /** @return array<string, mixed> */
    private function registrationSettings(Tenant $tenant): array
    {
        return ($tenant->settings ?? [])['member_registration'] ?? [];
    }
}
