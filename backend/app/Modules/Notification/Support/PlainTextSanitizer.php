<?php

namespace App\Modules\Notification\Support;

class PlainTextSanitizer
{
    public const MAX_TEXTAREA = 750;

    public const MAX_BUTTON_LABEL = 80;

    public const MAX_SUBJECT = 255;

    public static function clean(string $value): string
    {
        $value = strip_tags($value);
        $value = preg_replace('/javascript\s*:/i', '', $value) ?? $value;
        $value = preg_replace('/data\s*:\s*text\/html/i', '', $value) ?? $value;
        $value = preg_replace('/\bon\w+\s*=/i', '', $value) ?? $value;

        return trim(preg_replace("/\0/", '', $value) ?? $value);
    }

    public static function limit(string $value, int $max): string
    {
        if (function_exists('mb_substr')) {
            return mb_substr(self::clean($value), 0, $max);
        }

        return substr(self::clean($value), 0, $max);
    }

    /**
     * Valida y sanitiza body_html (JSON v2). Devuelve JSON normalizado o lanza InvalidArgumentException.
     */
    public static function normalizeBodyHtml(string $body): string
    {
        $trimmed = trim($body);
        if ($trimmed === '' || ! str_starts_with($trimmed, '{')) {
            return self::limit($trimmed, 8000);
        }

        $decoded = json_decode($trimmed, true);
        if (! is_array($decoded) || ($decoded['v'] ?? null) !== 2) {
            return $body;
        }

        $decoded['message'] = self::limit((string) ($decoded['message'] ?? ''), self::MAX_TEXTAREA);

        if (isset($decoded['note'])) {
            $decoded['note'] = self::limit((string) $decoded['note'], self::MAX_TEXTAREA);
        }

        if (isset($decoded['button']) && is_array($decoded['button'])) {
            $decoded['button']['label'] = self::limit(
                (string) ($decoded['button']['label'] ?? ''),
                self::MAX_BUTTON_LABEL
            );
            unset($decoded['button']['url']);
        }

        return json_encode($decoded, JSON_UNESCAPED_UNICODE) ?: $body;
    }
}
