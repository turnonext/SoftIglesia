<?php

namespace Database\Seeders;

use App\Modules\ChurchPeople\Models\Nationality;
use Illuminate\Database\Seeder;

class NationalitySeeder extends Seeder
{
    /** @var list<array{name: string, code?: string}> */
    private const NATIONALITIES = [
        ['name' => 'Argentina', 'code' => 'AR'],
        ['name' => 'Bolivia', 'code' => 'BO'],
        ['name' => 'Brasil', 'code' => 'BR'],
        ['name' => 'Chile', 'code' => 'CL'],
        ['name' => 'Paraguay', 'code' => 'PY'],
        ['name' => 'Uruguay', 'code' => 'UY'],
        ['name' => 'Perú', 'code' => 'PE'],
        ['name' => 'Colombia', 'code' => 'CO'],
        ['name' => 'Venezuela', 'code' => 'VE'],
        ['name' => 'Ecuador', 'code' => 'EC'],
        ['name' => 'México', 'code' => 'MX'],
        ['name' => 'Cuba', 'code' => 'CU'],
        ['name' => 'República Dominicana', 'code' => 'DO'],
        ['name' => 'España', 'code' => 'ES'],
        ['name' => 'Italia', 'code' => 'IT'],
        ['name' => 'Alemania', 'code' => 'DE'],
        ['name' => 'Francia', 'code' => 'FR'],
        ['name' => 'Portugal', 'code' => 'PT'],
        ['name' => 'Estados Unidos', 'code' => 'US'],
        ['name' => 'Canadá', 'code' => 'CA'],
        ['name' => 'China', 'code' => 'CN'],
        ['name' => 'Corea del Sur', 'code' => 'KR'],
        ['name' => 'Japón', 'code' => 'JP'],
        ['name' => 'Armenia', 'code' => 'AM'],
        ['name' => 'Siria', 'code' => 'SY'],
        ['name' => 'Líbano', 'code' => 'LB'],
        ['name' => 'Israel', 'code' => 'IL'],
        ['name' => 'Rusia', 'code' => 'RU'],
        ['name' => 'Ucrania', 'code' => 'UA'],
        ['name' => 'Haití', 'code' => 'HT'],
    ];

    public function run(): void
    {
        foreach (self::NATIONALITIES as $index => $row) {
            Nationality::query()->updateOrCreate(
                ['name' => $row['name']],
                [
                    'code' => $row['code'] ?? null,
                    'sort_order' => $index + 1,
                ]
            );
        }
    }
}
