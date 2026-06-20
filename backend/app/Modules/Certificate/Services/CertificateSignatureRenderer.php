<?php

namespace App\Modules\Certificate\Services;

use App\Modules\Shared\Support\PreferredStorageDisk;
use Illuminate\Support\Facades\Storage;

class CertificateSignatureRenderer
{
    /**
     * @param  array<int, array{enabled: bool, name: string, title: string, image_path: string|null}>  $signatures
     */
    public function buildSectionHtml(array $signatures, ?string $preferredDisk = null): string
    {
        $items = [];
        foreach ($signatures as $index => $slot) {
            if (! ($slot['enabled'] ?? false)) {
                continue;
            }
            $items[] = $this->renderSlot($index + 1, $slot, $preferredDisk);
        }

        if ($items === []) {
            return '';
        }

        $count = count($items);
        $justify = $count === 1 ? 'center' : 'space-around';

        return '<div class="certificate-signatures" style="margin-top:48px;display:flex;justify-content:'
            .$justify.';align-items:flex-end;gap:32px;flex-wrap:wrap;padding:0 24px;">'
            .implode('', $items)
            .'</div>';
    }

    /**
     * @param  array<int, array{enabled: bool, name: string, title: string, image_path: string|null}>  $signatures
     * @return array<string, string>
     */
    public function variables(array $signatures, ?string $preferredDisk = null): array
    {
        $vars = ['signatures_section' => $this->buildSectionHtml($signatures, $preferredDisk)];

        for ($i = 1; $i <= 3; $i++) {
            $slot = $signatures[$i - 1] ?? null;
            $enabled = $slot && ($slot['enabled'] ?? false);
            $vars["signature_{$i}_name"] = $enabled ? ($slot['name'] ?: '—') : '';
            $vars["signature_{$i}_title"] = $enabled ? ($slot['title'] ?: '') : '';
            $vars["signature_{$i}_image"] = $enabled
                ? $this->imageDataUri($slot['image_path'] ?? null, $preferredDisk)
                : '';
        }

        return $vars;
    }

    /**
     * @param  array{enabled: bool, name: string, title: string, image_path: string|null}  $slot
     */
    private function resolveDisk(?string $preferredDisk): string
    {
        return $preferredDisk ?? PreferredStorageDisk::resolve();
    }

    /**
     * @param  array{enabled: bool, name: string, title: string, image_path: string|null}  $slot
     */
    private function renderSlot(int $number, array $slot, ?string $preferredDisk): string
    {
        $preferredDisk = $this->resolveDisk($preferredDisk);
        $name = htmlspecialchars($slot['name'] ?: '—', ENT_QUOTES, 'UTF-8');
        $title = htmlspecialchars($slot['title'] ?: '', ENT_QUOTES, 'UTF-8');
        $img = $this->imageDataUri($slot['image_path'] ?? null, $preferredDisk);

        $imageHtml = $img !== ''
            ? '<img src="'.$img.'" alt="" style="max-height:56px;max-width:160px;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" />'
            : '';

        $titleHtml = $title !== ''
            ? '<span style="display:block;font-size:12px;color:#666;margin-top:4px;">'.$title.'</span>'
            : '';

        return '<div class="certificate-signature-'.$number.'" style="text-align:center;min-width:160px;max-width:220px;">'
            .$imageHtml
            .'<div style="border-top:1px solid #333;padding-top:8px;margin-top:4px;">'
            .'<strong style="display:block;font-size:14px;color:#1a1a2e;">'.$name.'</strong>'
            .$titleHtml
            .'</div></div>';
    }

    private function imageDataUri(?string $path, ?string $preferredDisk): string
    {
        if (! $path) {
            return '';
        }

        $preferredDisk = $this->resolveDisk($preferredDisk);
        $disks = array_values(array_unique([
            $preferredDisk,
            PreferredStorageDisk::s3AdapterAvailable() ? 's3' : null,
            'public',
            'local',
        ]));

        foreach ($disks as $disk) {
            if (! $disk) {
                continue;
            }
            if (! config("filesystems.disks.{$disk}")) {
                continue;
            }
            try {
                if (! Storage::disk($disk)->exists($path)) {
                    continue;
                }
                $mime = Storage::disk($disk)->mimeType($path) ?: 'image/png';
                $raw = Storage::disk($disk)->get($path);

                return 'data:'.$mime.';base64,'.base64_encode($raw);
            } catch (\Throwable) {
                continue;
            }
        }

        return '';
    }
}
