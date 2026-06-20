<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $appName }}</title>
</head>
<body style="margin:0;padding:0;background-color:{{ $theme['surface'] }};font-family:Segoe UI,Helvetica,Arial,sans-serif;">
@if($previewText)
    <div style="display:none;max-height:0;overflow:hidden;">{{ $previewText }}</div>
@endif
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:{{ $theme['surface'] }};padding:32px 16px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:{{ $theme['background'] }};border-radius:16px;border:1px solid {{ $theme['primary'] }}59;overflow:hidden;">
                <tr>
                    <td style="background:linear-gradient(135deg,{{ $theme['primary'] }} 0%,{{ $theme['accent'] }} 100%);padding:28px 32px;text-align:center;">
                        <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">{{ $appName }}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:32px;color:{{ $theme['text'] }};font-size:16px;line-height:1.65;">
                        {!! $innerHtml !!}
                    </td>
                </tr>
                <tr>
                    <td style="padding:20px 32px 28px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
                        <p style="margin:0;color:{{ $theme['muted'] }};font-size:12px;line-height:1.5;">
                            © {{ date('Y') }} {{ $appName }} · Campus virtual
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
