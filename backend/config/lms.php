<?php

return [
    'app_name' => env('LMS_APP_NAME', 'LMS EduCore'),
    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/'),
    'email_theme' => [
        'primary' => '#FF4E44',
        'accent' => '#DE7571',
        'background' => '#282634',
        'surface' => '#1e1c26',
        'muted' => '#A1A6AA',
        'text' => '#f5f5f5',
    ],
];
