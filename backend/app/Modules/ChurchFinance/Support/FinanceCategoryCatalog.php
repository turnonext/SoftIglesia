<?php

namespace App\Modules\ChurchFinance\Support;

class FinanceCategoryCatalog
{
    public const GROUPS = ['income', 'expense', 'assets', 'cash_banks', 'transfers'];

    /**
     * @return array<string, array<int, array{name: string, type: string}>>
     */
    public static function defaults(): array
    {
        return [
            'income' => [
                ['name' => 'Diezmos', 'type' => 'tithes'],
                ['name' => 'Ofrendas', 'type' => 'offering'],
                ['name' => 'Donaciones', 'type' => 'income'],
                ['name' => 'Eventos', 'type' => 'income'],
                ['name' => 'Otros', 'type' => 'income'],
            ],
            'expense' => [
                ['name' => 'Servicios', 'type' => 'expense'],
                ['name' => 'Mantenimiento', 'type' => 'expense'],
                ['name' => 'Ministerios', 'type' => 'expense'],
                ['name' => 'Ayuda Social', 'type' => 'expense'],
                ['name' => 'Personal', 'type' => 'expense'],
                ['name' => 'Otros', 'type' => 'expense'],
            ],
            'assets' => [
                ['name' => 'Equipamiento', 'type' => 'expense'],
                ['name' => 'Mobiliario', 'type' => 'expense'],
                ['name' => 'Propiedades', 'type' => 'expense'],
            ],
            'cash_banks' => [
                ['name' => 'Caja', 'type' => 'income'],
                ['name' => 'Cuenta Bancaria', 'type' => 'income'],
                ['name' => 'Billetera Virtual', 'type' => 'income'],
            ],
            'transfers' => [
                ['name' => 'Transferencia entre cuentas', 'type' => 'expense'],
            ],
        ];
    }

    public static function isValidGroup(string $group): bool
    {
        return in_array($group, self::GROUPS, true);
    }

    public static function defaultTypeForGroup(string $group): string
    {
        return match ($group) {
            'income' => 'income',
            'expense', 'assets', 'transfers' => 'expense',
            'cash_banks' => 'income',
            default => 'expense',
        };
    }
}
