<?php

namespace App\Modules\ChurchFinance\Support;

class SupportedCurrencies
{
    public const DEFAULT = 'ARS';

    /** @var list<string> */
    public const ALL = [
        'ARS', // Peso argentino
        'USD', // Dólar estadounidense
        'EUR', // Euro
        'GBP', // Libra esterlina
        'BRL', // Real brasileño
        'MXN', // Peso mexicano
        'CLP', // Peso chileno
        'COP', // Peso colombiano
        'JPY', // Yen japonés
        'CNY', // Yuan chino
        'CHF', // Franco suizo
    ];

    public static function isSupported(string $code): bool
    {
        return in_array(strtoupper($code), self::ALL, true);
    }

    public static function normalize(?string $code): string
    {
        $normalized = strtoupper(trim((string) $code));

        return self::isSupported($normalized) ? $normalized : self::DEFAULT;
    }
}
