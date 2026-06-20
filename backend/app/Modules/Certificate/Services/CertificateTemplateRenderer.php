<?php

namespace App\Modules\Certificate\Services;

class CertificateTemplateRenderer
{
    /**
     * @param  array<string, string>  $variables
     */
    public function render(string $html, array $variables): string
    {
        return preg_replace_callback(
            '/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/',
            fn (array $matches) => $variables[$matches[1]] ?? $matches[0],
            $html
        );
    }
}
