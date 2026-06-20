<?php

return [
    'zoom' => [
        'token_url' => 'https://zoom.us/oauth/token',
        'api_base' => 'https://api.zoom.us/v2',
    ],
    'google' => [
        'token_url' => 'https://oauth2.googleapis.com/token',
        'calendar_base' => 'https://www.googleapis.com/calendar/v3',
    ],
    'fallback_when_unconfigured' => env('MEETING_FALLBACK_LINKS', true),
];
