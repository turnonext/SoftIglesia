<?php

namespace App\Modules\Integrations\Services;

use App\Modules\Classroom\Models\ClassSession;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GoogleMeetMeetingProvider
{
    public function __construct(
        private readonly TenantMeetingCredentialService $credentials,
    ) {}

    public function isConfigured(string $tenantId): bool
    {
        $creds = $this->credentials->getDecrypted($tenantId, 'meet');

        return $creds
            && ! empty($creds['client_id'])
            && ! empty($creds['client_secret'])
            && ! empty($creds['refresh_token']);
    }

    /**
     * @return array{join_url: string, meeting_id: string, start_url: string|null, password: string|null, provider_meta: array<string, mixed>}
     */
    public function createMeeting(ClassSession $session): array
    {
        $creds = $this->credentials->getDecrypted($session->tenant_id, 'meet');
        if (! $creds) {
            throw new RuntimeException('Google Meet no está configurado para esta organización.');
        }

        $token = $this->accessToken($session->tenant_id, $creds);
        $startsAt = $session->starts_at;
        $endsAt = $session->ends_at ?? $startsAt?->copy()->addMinutes($session->duration_minutes ?? 60);
        if (! $startsAt || ! $endsAt) {
            throw new RuntimeException('La clase no tiene horario válido.');
        }

        $calendarId = rawurlencode($creds['calendar_id'] ?? 'primary');
        $tz = config('app.timezone', 'UTC');
        $requestId = Str::lower(Str::replace('-', '', (string) Str::ulid()));

        $url = config('meeting.google.calendar_base')."/calendars/{$calendarId}/events?conferenceDataVersion=1";

        $response = Http::withToken($token)
            ->acceptJson()
            ->post($url, [
                'summary' => $session->title,
                'description' => 'Clase LMS — '.$session->id,
                'start' => [
                    'dateTime' => $startsAt->format('Y-m-d\TH:i:s'),
                    'timeZone' => $tz,
                ],
                'end' => [
                    'dateTime' => $endsAt->format('Y-m-d\TH:i:s'),
                    'timeZone' => $tz,
                ],
                'conferenceData' => [
                    'createRequest' => [
                        'requestId' => $requestId,
                        'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
                    ],
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Google Calendar API: '.$response->json('error.message', $response->body())
            );
        }

        $body = $response->json();
        $entryPoints = $body['conferenceData']['entryPoints'] ?? [];
        $joinUrl = null;
        foreach ($entryPoints as $ep) {
            if (($ep['entryPointType'] ?? '') === 'video') {
                $joinUrl = $ep['uri'] ?? null;
                break;
            }
        }
        $joinUrl ??= $body['hangoutLink'] ?? null;

        if (! $joinUrl) {
            throw new RuntimeException('Google no devolvió enlace de Meet.');
        }

        return [
            'meeting_id' => (string) ($body['id'] ?? $requestId),
            'join_url' => (string) $joinUrl,
            'start_url' => (string) $joinUrl,
            'password' => null,
            'provider_meta' => [
                'mode' => 'google_calendar',
                'event_id' => $body['id'] ?? null,
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }

    public function testConnection(string $tenantId): void
    {
        $creds = $this->credentials->getDecrypted($tenantId, 'meet');
        if (! $creds) {
            throw new RuntimeException('Completá Client ID, Client Secret y Refresh Token.');
        }

        $token = $this->accessToken($tenantId, $creds);
        $calendarId = rawurlencode($creds['calendar_id'] ?? 'primary');

        $response = Http::withToken($token)
            ->get(config('meeting.google.calendar_base')."/calendars/{$calendarId}");

        if (! $response->successful()) {
            throw new RuntimeException(
                'No se pudo acceder al calendario: '.$response->json('error.message', $response->body())
            );
        }

        $this->credentials->markVerified($tenantId, 'meet');
    }

    /**
     * @param  array<string, mixed>  $creds
     */
    private function accessToken(string $tenantId, array $creds): string
    {
        $cacheKey = 'google_meet_token:'.$tenantId;

        return Cache::remember($cacheKey, 3000, function () use ($creds) {
            $response = Http::asForm()->post(config('meeting.google.token_url'), [
                'grant_type' => 'refresh_token',
                'client_id' => $creds['client_id'],
                'client_secret' => $creds['client_secret'],
                'refresh_token' => $creds['refresh_token'],
            ]);

            if (! $response->successful()) {
                throw new RuntimeException(
                    'No se pudo refrescar el token de Google: '.$response->json('error_description', $response->body())
                );
            }

            $token = $response->json('access_token');
            if (! is_string($token) || $token === '') {
                throw new RuntimeException('Google no devolvió access_token.');
            }

            return $token;
        });
    }
}
