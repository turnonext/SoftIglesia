<?php

namespace App\Modules\Notification\Support;

use App\Modules\Shared\Models\Tenant;
use App\Modules\Shared\Services\TenantBrandingService;

class EmailTheme
{
    /**
     * @return array{primary: string, accent: string, background: string, surface: string, muted: string, text: string}
     */
    public static function system(): array
    {
        $t = config('lms.email_theme');

        return [
            'primary' => $t['primary'],
            'accent' => $t['accent'],
            'background' => $t['background'],
            'surface' => $t['surface'],
            'muted' => $t['muted'],
            'text' => $t['text'],
        ];
    }

    /**
     * Colores del tenant cuando la plantilla usa tema del sistema.
     *
     * @return array{primary: string, accent: string, background: string, surface: string, muted: string, text: string}
     */
    public static function forTenant(?Tenant $tenant): array
    {
        if ($tenant === null) {
            return self::system();
        }

        /** @var TenantBrandingService $branding */
        $branding = app(TenantBrandingService::class);
        $present = $branding->present($tenant);
        $colors = $present['branding'];
        $system = self::system();

        return [
            'primary' => $colors['primary'],
            'accent' => $colors['primary_hover'],
            'background' => $colors['sidebar'],
            'surface' => $system['surface'],
            'muted' => $system['muted'],
            'text' => $system['text'],
        ];
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @return array{primary: string, accent: string, background: string, surface: string, muted: string, text: string}
     */
    public static function resolve(?array $stored, ?Tenant $tenant = null): array
    {
        $base = self::forTenant($tenant);

        if (! is_array($stored) || ($stored['mode'] ?? 'system') === 'system') {
            return $base;
        }

        return [
            'primary' => self::sanitizeColor((string) ($stored['primary'] ?? $base['primary']), $base['primary']),
            'accent' => self::sanitizeColor((string) ($stored['accent'] ?? $base['accent']), $base['accent']),
            'background' => self::sanitizeColor((string) ($stored['background'] ?? $base['background']), $base['background']),
            'surface' => $base['surface'],
            'muted' => $base['muted'],
            'text' => $base['text'],
        ];
    }

    private static function sanitizeColor(string $value, string $fallback): string
    {
        return preg_match('/^#[0-9A-Fa-f]{6}$/', $value) ? $value : $fallback;
    }
}
