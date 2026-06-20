<?php

namespace App\Modules\Certificate\Support;

final class CertificateHtmlSanitizer
{
    public const MAX_BYTES = 102400;

    public static function sanitize(string $html): string
    {
        $html = trim($html);
        if ($html === '') {
            return '';
        }

        $html = preg_replace('/<script\b[^>]*>[\s\S]*?<\/script>/iu', '', $html) ?? $html;
        $html = preg_replace('/<iframe\b[^>]*>[\s\S]*?<\/iframe>/iu', '', $html) ?? $html;
        $html = preg_replace('/\s+on\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/iu', '', $html) ?? $html;
        $html = preg_replace('/javascript\s*:/iu', '', $html) ?? $html;

        if (strlen($html) > self::MAX_BYTES) {
            $html = substr($html, 0, self::MAX_BYTES);
        }

        return $html;
    }

    public static function blankScaffold(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Certificado — {{course_name}}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; color: #1e1c26; }
    h1 { color: #FF4E44; }
  </style>
</head>
<body>
  <h1>{{tenant_name}}</h1>
  <p>Certificamos que <strong>{{student_name}}</strong> completó <strong>{{course_name}}</strong>.</p>
  <p>Fecha: {{completion_date}} · Código: {{certificate_code}}</p>
  {{signatures_section}}
</body>
</html>
HTML;
    }
}
