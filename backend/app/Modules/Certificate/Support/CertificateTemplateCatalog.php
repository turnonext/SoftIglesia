<?php

namespace App\Modules\Certificate\Support;

final class CertificateTemplateCatalog
{
    public const KEY_CLASSIC = 'classic';

    public const KEY_MODERN = 'modern';

    /**
     * @return array<int, array{key: string, label: string, example: string}>
     */
    public static function variables(): array
    {
        return [
            ['key' => 'student_name', 'label' => 'Nombre del estudiante', 'example' => 'María García'],
            ['key' => 'course_name', 'label' => 'Nombre del curso', 'example' => 'Introducción a la programación'],
            ['key' => 'completion_date', 'label' => 'Fecha de finalización', 'example' => '20/05/2026'],
            ['key' => 'issued_date', 'label' => 'Fecha de emisión', 'example' => '20/05/2026'],
            ['key' => 'certificate_code', 'label' => 'Código de verificación', 'example' => 'CERT-DEMO-2026-001'],
            ['key' => 'tenant_name', 'label' => 'Organización', 'example' => 'Demo Academy'],
            ['key' => 'instructor_name', 'label' => 'Instructor', 'example' => 'Prof. Juan Pérez'],
            ['key' => 'duration_hours', 'label' => 'Horas cursadas', 'example' => '40'],
            ['key' => 'signatures_section', 'label' => 'Bloque de firmas (auto)', 'example' => ''],
            ['key' => 'signature_1_name', 'label' => 'Firma 1 — nombre', 'example' => 'Dr. Ana López'],
            ['key' => 'signature_1_title', 'label' => 'Firma 1 — cargo', 'example' => 'Directora académica'],
            ['key' => 'signature_2_name', 'label' => 'Firma 2 — nombre', 'example' => 'Prof. Juan Pérez'],
            ['key' => 'signature_2_title', 'label' => 'Firma 2 — cargo', 'example' => 'Instructor'],
            ['key' => 'signature_3_name', 'label' => 'Firma 3 — nombre', 'example' => ''],
            ['key' => 'signature_3_title', 'label' => 'Firma 3 — cargo', 'example' => ''],
        ];
    }

    /**
     * @return array<string, array{name: string, body_html: string}>
     */
    public static function systemDefinitions(): array
    {
        return [
            self::KEY_CLASSIC => [
                'name' => 'Clásico institucional',
                'body_html' => self::classicHtml(),
            ],
            self::KEY_MODERN => [
                'name' => 'Moderno con acento',
                'body_html' => self::modernHtml(),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function demoVariables(): array
    {
        $vars = [];
        foreach (self::variables() as $row) {
            if ($row['key'] === 'signatures_section') {
                continue;
            }
            $vars[$row['key']] = $row['example'];
        }

        return $vars;
    }

    private static function classicHtml(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Certificado — {{course_name}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, "Times New Roman", serif; background: #f4f1ec; padding: 32px; }
    .page { max-width: 900px; margin: 0 auto; background: #fff; border: 8px double #1a1a2e; padding: 56px 64px; }
    .org { text-align: center; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; color: #555; }
    h1 { text-align: center; font-size: 36px; margin: 24px 0 8px; color: #1a1a2e; }
    .subtitle { text-align: center; color: #666; margin-bottom: 40px; }
    .lead { text-align: center; font-size: 18px; color: #444; margin-bottom: 12px; }
    .name { text-align: center; font-size: 42px; color: #FF4E44; margin: 16px 0 32px; font-weight: bold; }
    .course { text-align: center; font-size: 22px; margin-bottom: 8px; }
    .meta { text-align: center; font-size: 15px; color: #555; line-height: 1.8; margin-top: 32px; }
    .code { margin-top: 40px; text-align: center; font-size: 12px; color: #888; font-family: monospace; }
    .certificate-signatures { margin-top: 48px; }
  </style>
</head>
<body>
  <div class="page">
    <p class="org">{{tenant_name}}</p>
    <h1>Certificado de finalización</h1>
    <p class="subtitle">Programa académico certificado</p>
    <p class="lead">Se certifica que</p>
    <p class="name">{{student_name}}</p>
    <p class="lead">ha completado satisfactoriamente el curso</p>
    <p class="course">{{course_name}}</p>
    <p class="meta">
      Duración: {{duration_hours}} horas<br />
      Fecha de finalización: {{completion_date}}<br />
      Emitido el {{issued_date}}
    </p>
    {{signatures_section}}
    <p class="code">Código de verificación: {{certificate_code}}</p>
  </div>
</body>
</html>
HTML;
    }

    private static function modernHtml(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Certificado — {{course_name}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", system-ui, sans-serif; background: #282634; padding: 32px; }
    .page { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,.35); }
    .head { background: linear-gradient(135deg, #FF4E44, #DE7571); color: #fff; padding: 40px 48px; text-align: center; }
    .head h1 { font-size: 28px; font-weight: 700; letter-spacing: 0.04em; }
    .head p { margin-top: 8px; opacity: 0.9; font-size: 14px; }
    .body { padding: 48px 56px; text-align: center; color: #1e1c26; }
    .badge { display: inline-block; background: #FF4E44; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; margin-bottom: 24px; }
    .name { font-size: 40px; font-weight: 800; margin: 16px 0; line-height: 1.2; }
    .course { font-size: 20px; color: #DE7571; font-weight: 600; margin: 24px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 36px; text-align: left; font-size: 14px; color: #555; }
    .grid strong { display: block; color: #1e1c26; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .code { margin-top: 40px; font-family: ui-monospace, monospace; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="page">
    <div class="head">
      <h1>{{tenant_name}}</h1>
      <p>Certificado de logro académico</p>
    </div>
    <div class="body">
      <span class="badge">Certificado oficial</span>
      <p>Otorgado a</p>
      <p class="name">{{student_name}}</p>
      <p class="course">{{course_name}}</p>
      <div class="grid">
        <div><strong>Horas</strong>{{duration_hours}} h</div>
        <div><strong>Finalización</strong>{{completion_date}}</div>
        <div><strong>Instructor</strong>{{instructor_name}}</div>
        <div><strong>Emisión</strong>{{issued_date}}</div>
      </div>
      {{signatures_section}}
      <p class="code">Verificar: {{certificate_code}}</p>
    </div>
  </div>
</body>
</html>
HTML;
    }
}
