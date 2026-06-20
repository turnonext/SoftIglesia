<?php

namespace App\Modules\Notification\Support;

class EmailTemplateCatalog
{
    public const KEY_USER_PROMOTED_INSTRUCTOR = 'user_promoted_instructor';

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function definitions(): array
    {
        return [
            self::KEY_USER_PROMOTED_INSTRUCTOR => [
                'name' => 'Promoción a profesor',
                'subject' => '¡Ahora sos profesor en {{tenant_name}}!',
                'body_html' => '{"v":2,"message":"Hola **{{user_name}}**,\\n\\nEl equipo de **{{tenant_name}}** te asignó el rol de **profesor** en la plataforma {{app_name}}.\\n\\nYa podés crear cursos, programar clases en vivo y gestionar materiales para tus estudiantes.","button":{"label":"Ingresar al campus"},"note":"Si no esperabas este cambio, contactá al administrador de tu cliente.","theme":{"mode":"system"}}',
                'available_variables' => [
                    ['key' => 'user_name', 'label' => 'Nombre del usuario', 'example' => 'María García'],
                    ['key' => 'user_email', 'label' => 'Email del usuario', 'example' => 'maria@demo.com'],
                    ['key' => 'tenant_name', 'label' => 'Cliente', 'example' => 'Demo Academy'],
                    ['key' => 'app_name', 'label' => 'Nombre de la app', 'example' => 'LMS EduCore'],
                ],
            ],
        ];
    }

    /**
     * @return array<int, array{key: string, label: string, example: string}>
     */
    public static function variablesFor(string $key): array
    {
        return self::definitions()[$key]['available_variables'] ?? [];
    }
}
