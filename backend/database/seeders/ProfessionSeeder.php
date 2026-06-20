<?php

namespace Database\Seeders;

use App\Modules\ChurchPeople\Models\Profession;
use Illuminate\Database\Seeder;

class ProfessionSeeder extends Seeder
{
    /** @var list<string> */
    private const PROFESSIONS = [
        'Docente / Profesor',
        'Médico',
        'Enfermero/a',
        'Abogado/a',
        'Contador/a',
        'Empleado público',
        'Administrativo / Oficinista',
        'Comerciante',
        'Vendedor / Empleado de comercio',
        'Obrero / Operario de fábrica',
        'Técnico industrial',
        'Electricista',
        'Plomero / Gasista',
        'Albañil / Construcción',
        'Chofer / Transportista',
        'Taxista / Remisero',
        'Empleado bancario',
        'Desarrollador de software',
        'Diseñador gráfico',
        'Cocinero / Chef',
        'Mozo / Camarero',
        'Empleado de limpieza',
        'Seguridad / Vigilador',
        'Agricultor / Trabajador rural',
        'Veterinario/a',
        'Estudiante',
        'Jubilado/a',
        'Ama de casa',
        'Desempleado',
        'Independiente / Monotributista',
    ];

    public function run(): void
    {
        foreach (self::PROFESSIONS as $index => $name) {
            Profession::query()->updateOrCreate(
                ['name' => $name],
                ['sort_order' => $index + 1]
            );
        }
    }
}
