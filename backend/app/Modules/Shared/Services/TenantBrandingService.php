<?php

namespace App\Modules\Shared\Services;

use App\Modules\Shared\Models\Tenant;

class TenantBrandingService
{
    public const DEFAULT_PRIMARY = '#FF4E44';

    public const DEFAULT_PRIMARY_HOVER = '#DE7571';

    public const DEFAULT_ACCENT = '#BD928B';

    public const DEFAULT_SIDEBAR = '#282634';

    /**
     * @return array{primary: string, primary_hover: string, accent: string, sidebar: string}
     */
    public function defaults(): array
    {
        return [
            'primary' => self::DEFAULT_PRIMARY,
            'primary_hover' => self::DEFAULT_PRIMARY_HOVER,
            'accent' => self::DEFAULT_ACCENT,
            'sidebar' => self::DEFAULT_SIDEBAR,
        ];
    }

    /**
     * @return array{name: string, slug: string, branding: array<string, string>}
     */
    public function present(Tenant $tenant): array
    {
        $settings = $tenant->settings ?? [];
        $branding = array_merge($this->defaults(), $settings['branding'] ?? []);

        return [
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'branding' => [
                'primary' => $this->normalizeHex($branding['primary'] ?? self::DEFAULT_PRIMARY),
                'primary_hover' => $this->normalizeHex($branding['primary_hover'] ?? self::DEFAULT_PRIMARY_HOVER),
                'accent' => $this->normalizeHex($branding['accent'] ?? self::DEFAULT_ACCENT),
                'sidebar' => $this->normalizeHex($branding['sidebar'] ?? self::DEFAULT_SIDEBAR),
            ],
        ];
    }

    /**
     * @param  array{name?: string, branding?: array<string, string|null>}  $input
     */
    public function update(Tenant $tenant, array $input): Tenant
    {
        if (isset($input['name']) && is_string($input['name'])) {
            $tenant->name = trim($input['name']);
        }

        if (isset($input['branding']) && is_array($input['branding'])) {
            $settings = $tenant->settings ?? [];
            $current = array_merge($this->defaults(), $settings['branding'] ?? []);
            $incoming = $input['branding'];

            foreach (['primary', 'primary_hover', 'accent', 'sidebar'] as $key) {
                if (! empty($incoming[$key]) && is_string($incoming[$key])) {
                    $current[$key] = $this->normalizeHex($incoming[$key]);
                }
            }

            $settings['branding'] = $current;
            $tenant->settings = $settings;
        }

        $tenant->save();

        return $tenant->fresh();
    }

    public function normalizeHex(string $color): string
    {
        $color = trim($color);
        if (! preg_match('/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/', $color)) {
            return self::DEFAULT_PRIMARY;
        }

        if (strlen($color) === 4) {
            $r = $color[1];
            $g = $color[2];
            $b = $color[3];

            return '#'.strtoupper($r.$r.$g.$g.$b.$b);
        }

        return '#'.strtoupper(substr($color, 1));
    }
}
