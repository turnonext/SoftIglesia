<?php

namespace App\Modules\Notification\Services;

use App\Modules\Notification\Support\EmailTheme;

class EmailBodyCompiler
{
    public const BUTTON_URL = '{{login_url}}';

    /**
     * @return array{html: string, theme: array<string, string>}
     */
    public function compile(string $body, ?\App\Modules\Shared\Models\Tenant $tenant = null): array
    {
        $trimmed = trim($body);
        if ($trimmed === '') {
            return ['html' => '', 'theme' => EmailTheme::forTenant($tenant)];
        }

        if (str_starts_with($trimmed, '{')) {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                $theme = EmailTheme::resolve($decoded['theme'] ?? null, $tenant);

                if (($decoded['v'] ?? null) === 2) {
                    return ['html' => $this->compileSimple($decoded, $theme), 'theme' => $theme];
                }

                if (($decoded['v'] ?? null) === 1 && is_array($decoded['blocks'] ?? null)) {
                    return ['html' => $this->compileBlocks($decoded['blocks'], $theme), 'theme' => $theme];
                }
            }
        }

        return ['html' => $body, 'theme' => EmailTheme::forTenant($tenant)];
    }

    /**
     * @param  array<string, mixed>  $doc
     * @param  array<string, string>  $theme
     */
    private function compileSimple(array $doc, array $theme): string
    {
        $parts = [];
        $message = (string) ($doc['message'] ?? '');

        foreach (preg_split('/\n\s*\n/', $message) ?: [] as $chunk) {
            $text = trim($chunk);
            if ($text === '') {
                continue;
            }
            $text = preg_replace('/\s*\n\s*/', ' ', $text) ?? $text;
            $parts[] = '<p>'.$this->inlineTextToHtml($text).'</p>';
        }

        $button = $doc['button'] ?? null;
        if (is_array($button)) {
            $this->appendButton($parts, (string) ($button['label'] ?? ''), $theme);
        }

        $note = trim((string) ($doc['note'] ?? ''));
        if ($note !== '') {
            $this->appendNote($parts, $note, $theme);
        }

        return implode("\n", $parts);
    }

    /**
     * @param  array<int, array<string, mixed>>  $blocks
     * @param  array<string, string>  $theme
     */
    private function compileBlocks(array $blocks, array $theme): string
    {
        $parts = [];

        foreach ($blocks as $block) {
            $type = $block['type'] ?? '';
            match ($type) {
                'paragraph' => $this->appendParagraph($parts, (string) ($block['text'] ?? '')),
                'button' => $this->appendButton($parts, (string) ($block['label'] ?? ''), $theme),
                'note' => $this->appendNote($parts, (string) ($block['text'] ?? ''), $theme),
                default => null,
            };
        }

        return implode("\n", $parts);
    }

    /**
     * @param  array<int, string>  $parts
     */
    private function appendParagraph(array &$parts, string $text): void
    {
        $text = trim($text);
        if ($text === '') {
            return;
        }

        $parts[] = '<p>'.$this->inlineTextToHtml($text).'</p>';
    }

    /**
     * @param  array<int, string>  $parts
     * @param  array<string, string>  $theme
     */
    private function appendButton(array &$parts, string $label, array $theme): void
    {
        $label = trim($label);
        if ($label === '') {
            return;
        }

        $safeLabel = htmlspecialchars($label, ENT_QUOTES, 'UTF-8');
        $primary = $theme['primary'];

        $parts[] = '<p style="margin-top:24px;text-align:center;">'
            .'<a href="'.self::BUTTON_URL.'" style="display:inline-block;background:'.$primary.';color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">'
            .$safeLabel
            .'</a></p>';
    }

    /**
     * @param  array<int, string>  $parts
     * @param  array<string, string>  $theme
     */
    private function appendNote(array &$parts, string $text, array $theme): void
    {
        $text = trim($text);
        if ($text === '') {
            return;
        }

        $muted = $theme['muted'];
        $parts[] = '<p style="color:'.$muted.';font-size:14px;margin-top:24px;">'.$this->inlineTextToHtml($text).'</p>';
    }

    private function inlineTextToHtml(string $text): string
    {
        $escaped = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');

        return preg_replace(
            '/\*\*(.+?)\*\*/',
            '<strong>$1</strong>',
            $escaped
        ) ?? $escaped;
    }

    /** @deprecated Use compile() */
    public function toHtml(string $body): string
    {
        return $this->compile($body)['html'];
    }
}
