<?php

namespace App\Modules\Integrations\Services;

use App\Modules\Classroom\Models\ClassSession;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ZoomMeetingProvider
{
    public function __construct(
        private readonly TenantMeetingCredentialService $credentials,
    ) {}

    public function isConfigured(string $tenantId): bool
    {
        $creds = $this->credentials->getDecrypted($tenantId, 'zoom');

        return $creds
            && ! empty($creds['account_id'])
            && ! empty($creds['client_id'])
            && ! empty($creds['client_secret']);
    }

    /**
     * @return array{join_url: string, meeting_id: string, start_url: string|null, password: string|null, provider_meta: array<string, mixed>}
     */
    public function createMeeting(ClassSession $session): array
    {
        $creds = $this->credentials->getDecrypted($session->tenant_id, 'zoom');
        if (! $creds) {
            throw new RuntimeException('Zoom no está configurado para esta organización.');
        }

        $token = $this->accessToken($session->tenant_id, $creds);
        $startsAt = $session->starts_at;
        if (! $startsAt) {
            throw new RuntimeException('La clase no tiene fecha de inicio.');
        }

        $response = Http::withToken($token)
            ->acceptJson()
            ->post(config('meeting.zoom.api_base').'/users/me/meetings', [
                'topic' => $session->title,
                'type' => 2,
                'start_time' => $startsAt->utc()->format('Y-m-d\TH:i:s\Z'),
                'duration' => $session->duration_minutes ?? 60,
                'timezone' => config('app.timezone', 'UTC'),
                'settings' => [
                    'join_before_host' => true,
                    'waiting_room' => false,
                    'approval_type' => 2,
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Zoom API: '.$response->json('message', $response->body())
            );
        }

        $body = $response->json();

        return [
            'meeting_id' => (string) ($body['id'] ?? ''),
            'join_url' => (string) ($body['join_url'] ?? ''),
            'start_url' => $body['start_url'] ?? null,
            'password' => $body['password'] ?? null,
            'provider_meta' => [
                'mode' => 'zoom_api',
                'uuid' => $body['uuid'] ?? null,
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }

    public function testConnection(string $tenantId): void
    {
        $creds = $this->credentials->getDecrypted($tenantId, 'zoom');
        if (! $creds) {
            throw new RuntimeException('Completá Account ID, Client ID y Client Secret.');
        }

        $this->accessToken($tenantId, $creds);
        $this->credentials->markVerified($tenantId, 'zoom');
    }

    /**
     * @param  array<string, mixed>  $creds
     */
    private function accessToken(string $tenantId, array $creds): string
    {
        $cacheKey = 'zoom_token:'.$tenantId;

        return Cache::remember($cacheKey, 3500, function () use ($creds) {
            $response = Http::asForm()
                ->withBasicAuth($creds['client_id'], $creds['client_secret'])
                ->post(config('meeting.zoom.token_url'), [
                    'grant_type' => 'account_credentials',
                    'account_id' => $creds['account_id'],
                ]);

            if (! $response->successful()) {
                throw new RuntimeException(
                    'No se pudo autenticar con Zoom: '.$response->json('reason', $response->body())
                );
            }

            $token = $response->json('access_token');
            if (! is_string($token) || $token === '') {
                throw new RuntimeException('Zoom no devolvió access_token.');
            }

            return $token;
        });
    }
}
