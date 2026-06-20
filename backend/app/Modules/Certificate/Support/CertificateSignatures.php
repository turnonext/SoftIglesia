<?php

namespace App\Modules\Certificate\Support;

final class CertificateSignatures
{
    public const MAX_SLOTS = 3;

    /**
     * @return array<int, array{enabled: bool, name: string, title: string, image_path: string|null}>
     */
    public static function defaults(): array
    {
        return [
            ['enabled' => true, 'name' => '', 'title' => 'Director académico', 'image_path' => null],
            ['enabled' => false, 'name' => '', 'title' => '', 'image_path' => null],
            ['enabled' => false, 'name' => '', 'title' => '', 'image_path' => null],
        ];
    }

    /**
     * @param  array<int, mixed>|null  $input
     * @return array<int, array{enabled: bool, name: string, title: string, image_path: string|null}>
     */
    public static function normalize(?array $input): array
    {
        $defaults = self::defaults();
        if (! is_array($input)) {
            return $defaults;
        }

        $normalized = [];
        for ($i = 0; $i < self::MAX_SLOTS; $i++) {
            $row = is_array($input[$i] ?? null) ? $input[$i] : [];
            $normalized[] = [
                'enabled' => (bool) ($row['enabled'] ?? $defaults[$i]['enabled']),
                'name' => mb_substr(trim((string) ($row['name'] ?? '')), 0, 120),
                'title' => mb_substr(trim((string) ($row['title'] ?? '')), 0, 120),
                'image_path' => isset($row['image_path']) && $row['image_path'] !== ''
                    ? (string) $row['image_path']
                    : null,
            ];
        }

        return $normalized;
    }

    /**
     * Fusiona datos del formulario conservando rutas de imagen ya guardadas.
     *
     * @param  array<int, mixed>  $incoming
     * @param  array<int, array{enabled: bool, name: string, title: string, image_path: string|null}>  $existing
     * @return array<int, array{enabled: bool, name: string, title: string, image_path: string|null}>
     */
    public static function mergeFromInput(array $incoming, array $existing): array
    {
        $base = self::normalize($existing);

        for ($i = 0; $i < self::MAX_SLOTS; $i++) {
            $row = is_array($incoming[$i] ?? null) ? $incoming[$i] : [];
            $base[$i]['enabled'] = (bool) ($row['enabled'] ?? $base[$i]['enabled']);
            $base[$i]['name'] = mb_substr(trim((string) ($row['name'] ?? $base[$i]['name'])), 0, 120);
            $base[$i]['title'] = mb_substr(trim((string) ($row['title'] ?? $base[$i]['title'])), 0, 120);
        }

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'signatures' => ['sometimes', 'array', 'size:'.self::MAX_SLOTS],
            'signatures.*.enabled' => ['sometimes', 'boolean'],
            'signatures.*.name' => ['nullable', 'string', 'max:120'],
            'signatures.*.title' => ['nullable', 'string', 'max:120'],
        ];
    }
}
