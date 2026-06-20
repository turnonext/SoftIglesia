<?php

namespace App\Modules\Integrations\Services;

use App\Modules\Classroom\Models\ClassSession;
use Illuminate\Support\Facades\Log;

class MeetingProviderResolver
{
    public function __construct(
        private readonly ZoomMeetingProvider $zoom,
        private readonly GoogleMeetMeetingProvider $meet,
        private readonly FallbackMeetingLinkBuilder $fallback,
    ) {}

    /**
     * @return array{join_url: string, meeting_id: string, start_url: string|null, password: string|null, provider_meta: array<string, mixed>}
     */
    public function createForSession(ClassSession $session): array
    {
        $provider = $session->provider ?? 'zoom';

        if ($provider === 'onsite') {
            return $this->fallback->build($session);
        }

        try {
            if ($provider === 'meet' && $this->meet->isConfigured($session->tenant_id)) {
                return $this->meet->createMeeting($session);
            }

            if (($provider === 'zoom' || $provider === 'meet') && $this->zoom->isConfigured($session->tenant_id)) {
                return $this->zoom->createMeeting($session);
            }
        } catch (\Throwable $e) {
            Log::warning('meeting.create_failed', [
                'class_id' => $session->id,
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            if (! config('meeting.fallback_when_unconfigured', true)) {
                throw $e;
            }
        }

        return $this->fallback->build($session);
    }
}
