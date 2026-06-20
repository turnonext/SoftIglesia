<?php

namespace App\Modules\Integrations\Services;

use App\Modules\Classroom\Models\ClassSession;
use Illuminate\Support\Str;

class FallbackMeetingLinkBuilder
{
    /**
     * Enlace simulado cuando el tenant no configuró credenciales (desarrollo / demo).
     *
     * @return array{join_url: string, meeting_id: string, start_url: string|null, password: string|null, provider_meta: array<string, mixed>}
     */
    public function build(ClassSession $session): array
    {
        $token = Str::lower(Str::substr(str_replace('-', '', $session->id), 0, 12));
        $provider = $session->provider ?? 'zoom';

        $built = match ($provider) {
            'meet' => [
                'meeting_id' => 'meet-'.$token,
                'join_url' => 'https://meet.google.com/'.$token,
                'start_url' => null,
                'password' => null,
            ],
            'onsite' => [
                'meeting_id' => 'onsite-'.$session->id,
                'join_url' => rtrim(config('app.url'), '/').'/classes/'.$session->id.'/onsite',
                'start_url' => null,
                'password' => null,
            ],
            default => [
                'meeting_id' => 'zoom-'.$token,
                'join_url' => 'https://zoom.us/j/'.$token.'?pwd='.Str::substr(md5($session->id), 0, 6),
                'start_url' => null,
                'password' => Str::substr(md5($session->id), 0, 6),
            ],
        };

        return [
            ...$built,
            'provider_meta' => [
                'mode' => 'fallback',
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }
}
