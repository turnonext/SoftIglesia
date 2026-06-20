<?php

namespace App\Modules\ChurchSeatEvents\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SeatReservationCaptchaService
{
  private const TTL_MINUTES = 10;

  /** @return array{captcha_id: string, image: string} */
  public function create(string $sessionToken): array
  {
    $left = random_int(1, 9);
    $right = random_int(1, 9);
    $answer = $left + $right;
    $captchaId = Str::random(40);

    Cache::put(
      $this->cacheKey($captchaId),
      [
        'answer' => $answer,
        'session_token' => $sessionToken,
      ],
      now()->addMinutes(self::TTL_MINUTES)
    );

    return [
      'captcha_id' => $captchaId,
      'image' => $this->renderImageDataUri("{$left} + {$right} = ?"),
    ];
  }

  public function verify(string $captchaId, int $answer, string $sessionToken): void
  {
    $stored = Cache::pull($this->cacheKey($captchaId));

    if (! is_array($stored) || ($stored['session_token'] ?? null) !== $sessionToken) {
      throw ValidationException::withMessages([
        'captcha_answer' => ['El código de verificación expiró. Genera uno nuevo.'],
      ]);
    }

    if ((int) ($stored['answer'] ?? -1) !== $answer) {
      throw ValidationException::withMessages([
        'captcha_answer' => ['La respuesta de verificación es incorrecta.'],
      ]);
    }
  }

  private function cacheKey(string $captchaId): string
  {
    return "seat_reservation_captcha:{$captchaId}";
  }

  private function renderImageDataUri(string $expression): string
  {
    $noise = '';
    for ($i = 0; $i < 6; $i++) {
      $x1 = random_int(0, 200);
      $y1 = random_int(0, 60);
      $x2 = random_int(0, 200);
      $y2 = random_int(0, 60);
      $stroke = sprintf('#%06X', random_int(0, 0xBBBBBB));
      $noise .= "<line x1=\"{$x1}\" y1=\"{$y1}\" x2=\"{$x2}\" y2=\"{$y2}\" stroke=\"{$stroke}\" stroke-width=\"1\" opacity=\"0.45\"/>";
    }

    $escaped = htmlspecialchars($expression, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60" role="img" aria-label="Verificación">
  <rect width="200" height="60" rx="8" fill="#f4f4f5"/>
  {$noise}
  <text x="100" y="38" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#18181b" letter-spacing="1">{$escaped}</text>
</svg>
SVG;

    return 'data:image/svg+xml;base64,'.base64_encode($svg);
  }
}
