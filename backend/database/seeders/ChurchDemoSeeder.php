<?php

namespace Database\Seeders;

use App\Modules\ChurchCampuses\Models\ChurchCampus;
use App\Modules\ChurchFinance\Models\FinanceCategory;
use App\Modules\ChurchFinance\Models\FinanceTransaction;
use App\Modules\ChurchGatherings\Models\ChurchGathering;
use App\Modules\ChurchGroups\Models\ChurchGroup;
use App\Modules\ChurchMinistries\Models\ChurchMinistry;
use App\Modules\ChurchSpaces\Models\ChurchSpace;
use App\Modules\ChurchSpaces\Models\ChurchSpaceReservation;
use App\Modules\Auth\Models\User;
use App\Modules\ChurchPeople\Models\Member;
use App\Modules\ChurchPeople\Models\MemberTimelineEvent;
use App\Modules\Shared\Models\Tenant;
use App\Modules\Shared\Scopes\TenantScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ChurchDemoSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->where('slug', 'demo')->first();
        if (! $tenant) {
            return;
        }

        $tenant->update([
            'name' => 'Iglesia Demo Mendoza',
        ]);

        $this->seedFinanceCategories($tenant->id);
        $this->cleanupObsoleteDemoData($tenant->id);
        $campuses = $this->seedCampuses($tenant->id);
        $hq = $campuses['hq'];
        $north = $campuses['north'];

        $this->seedMinistries($tenant->id, $hq->id, $north->id);
        $members = $this->seedMembers($tenant->id, $hq->id, $north->id);
        $this->seedGroups($tenant->id, $hq->id, $north->id);
        $this->seedGatherings($tenant->id, $hq->id, $north->id);
        $this->seedSpaces($tenant->id, $hq->id);
        $this->seedFinanceTransactions($tenant->id, $hq->id, $north->id);
        $this->seedMemberTimelines($tenant->id, $members);
    }

    private function cleanupObsoleteDemoData(string $tenantId): void
    {
        ChurchGroup::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->whereIn('name', [
                'Célula Centro',
                'Célula Familias Norte',
                'Grupo Juvenil',
            ])
            ->delete();

        ChurchCampus::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('code', 'NORTE')
            ->delete();
    }

    private function seedFinanceCategories(string $tenantId): void
    {
        $categories = [
            ['name' => 'Diezmos', 'type' => 'tithes'],
            ['name' => 'Ofrendas generales', 'type' => 'offering'],
            ['name' => 'Ofrendas especiales', 'type' => 'offering'],
            ['name' => 'Donaciones', 'type' => 'income'],
            ['name' => 'Eventos', 'type' => 'income'],
            ['name' => 'Nómina y personal', 'type' => 'expense'],
            ['name' => 'Instalaciones', 'type' => 'expense'],
            ['name' => 'Ministerios', 'type' => 'expense'],
            ['name' => 'Misiones', 'type' => 'expense'],
        ];

        foreach ($categories as $row) {
            FinanceCategory::query()
                ->withoutGlobalScope(TenantScope::class)
                ->updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $row['name']],
                    [
                        'type' => $row['type'],
                        'is_system' => true,
                        'is_active' => true,
                    ]
                );
        }
    }

    /**
     * @return array{hq: ChurchCampus, north: ChurchCampus}
     */
    private function seedCampuses(string $tenantId): array
    {
        $hq = ChurchCampus::query()
            ->withoutGlobalScope(TenantScope::class)
            ->updateOrCreate(
                ['tenant_id' => $tenantId, 'code' => 'HQ'],
                [
                    'name' => 'Sede Central Mendoza',
                    'address_line' => 'Av. San Martín 1143',
                    'city' => 'Mendoza',
                    'state' => 'Mendoza',
                    'country' => 'Argentina',
                    'phone' => '+54 261 420 0001',
                    'email' => 'central@iglesia-demo.test',
                    'leader_name' => 'Pastor Carlos Méndez',
                    'status' => 'active',
                    'is_headquarters' => true,
                    'member_count' => 420,
                    'group_count' => 18,
                ]
            );

        ChurchCampus::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('id', '!=', $hq->id)
            ->update(['is_headquarters' => false]);

        $north = ChurchCampus::query()
            ->withoutGlobalScope(TenantScope::class)
            ->updateOrCreate(
                ['tenant_id' => $tenantId, 'code' => 'GODOY'],
                [
                    'name' => 'Sede Godoy Cruz',
                    'address_line' => 'Av. Bandera de los Andes 2607',
                    'city' => 'Godoy Cruz',
                    'state' => 'Mendoza',
                    'country' => 'Argentina',
                    'phone' => '+54 261 420 0002',
                    'email' => 'godoycruz@iglesia-demo.test',
                    'leader_name' => 'Líder Ana Ruiz',
                    'status' => 'active',
                    'is_headquarters' => false,
                    'member_count' => 185,
                    'group_count' => 8,
                ]
            );

        ChurchCampus::query()
            ->withoutGlobalScope(TenantScope::class)
            ->updateOrCreate(
                ['tenant_id' => $tenantId, 'code' => 'SUR-PLAN'],
                [
                    'name' => 'Sede Sur (en planificación)',
                    'address_line' => 'Av. Acceso Sur',
                    'city' => 'Mendoza',
                    'state' => 'Mendoza',
                    'country' => 'Argentina',
                    'leader_name' => 'Equipo de expansión',
                    'status' => 'planned',
                    'is_headquarters' => false,
                    'member_count' => 0,
                    'group_count' => 0,
                ]
            );

        return ['hq' => $hq, 'north' => $north];
    }

    private function seedMinistries(string $tenantId, string $hqId, string $northId): void
    {
        $rows = [
            [
                'name' => 'Alabanza',
                'type' => 'worship',
                'campus_id' => $hqId,
                'leader_name' => 'David Herrera',
                'member_count' => 24,
                'volunteer_count' => 18,
            ],
            [
                'name' => 'Niños',
                'type' => 'children',
                'campus_id' => $hqId,
                'leader_name' => 'María López',
                'member_count' => 12,
                'volunteer_count' => 22,
            ],
            [
                'name' => 'Juvenil',
                'type' => 'youth',
                'campus_id' => $hqId,
                'leader_name' => 'Jorge Vega',
                'member_count' => 45,
                'volunteer_count' => 10,
            ],
            [
                'name' => 'Evangelismo',
                'type' => 'outreach',
                'campus_id' => null,
                'leader_name' => 'Rosa Campos',
                'member_count' => 30,
                'volunteer_count' => 35,
            ],
            [
                'name' => 'Medios y transmisión',
                'type' => 'media',
                'campus_id' => $hqId,
                'leader_name' => 'Luis Ortega',
                'member_count' => 8,
                'volunteer_count' => 14,
            ],
            [
                'name' => 'Recepción Godoy Cruz',
                'type' => 'general',
                'campus_id' => $northId,
                'leader_name' => 'Patricia Núñez',
                'member_count' => 6,
                'volunteer_count' => 12,
            ],
        ];

        foreach ($rows as $row) {
            ChurchMinistry::query()
                ->withoutGlobalScope(TenantScope::class)
                ->updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $row['name']],
                    array_merge($row, ['status' => 'active', 'description' => null])
                );
        }
    }

    /**
     * @return array<string, Member>
     */
    private function seedMembers(string $tenantId, string $hqId, string $northId): array
    {
        $rows = [
            [
                'key' => 'carlos',
                'first_name' => 'Carlos',
                'last_name' => 'Méndez',
                'email' => 'carlos.mendez@demo.test',
                'phone' => '+54 261 555 0001',
                'birth_date' => '1985-04-12',
                'status' => 'member',
                'campus_id' => $hqId,
                'member_since' => '2018-03-15',
                'discipleship_stage' => 'leader',
            ],
            [
                'key' => 'ana',
                'first_name' => 'Ana',
                'last_name' => 'Ruiz',
                'email' => 'ana.ruiz@demo.test',
                'birth_date' => '1990-11-03',
                'status' => 'member',
                'campus_id' => $northId,
                'member_since' => '2020-06-01',
                'discipleship_stage' => 'leader',
            ],
            [
                'key' => 'sofia',
                'first_name' => 'Sofía',
                'last_name' => 'Torres',
                'email' => 'sofia.torres@demo.test',
                'birth_date' => '1998-07-22',
                'status' => 'member',
                'campus_id' => $hqId,
                'member_since' => '2022-01-10',
                'baptized_at' => '2022-04-20',
            ],
            [
                'key' => 'miguel',
                'first_name' => 'Miguel',
                'last_name' => 'Aguilar',
                'birth_date' => '2001-02-15',
                'status' => 'visitor',
                'campus_id' => $hqId,
                'visitor_since' => now()->subWeeks(2)->toDateString(),
            ],
            [
                'key' => 'lucia',
                'first_name' => 'Lucía',
                'last_name' => 'Paredes',
                'email' => 'lucia.paredes@demo.test',
                'birth_date' => '1978-09-30',
                'status' => 'inactive',
                'campus_id' => $northId,
                'member_since' => '2019-08-22',
            ],
        ];

        $out = [];
        foreach ($rows as $row) {
            $key = $row['key'];
            unset($row['key']);
            $unique = [
                'tenant_id' => $tenantId,
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
            ];
            if (! empty($row['email'])) {
                $unique['email'] = $row['email'];
            }

            $out[$key] = Member::query()
                ->withoutGlobalScope(TenantScope::class)
                ->updateOrCreate(
                    $unique,
                    array_merge($row, [
                        'last_attended_at' => $row['status'] === 'visitor'
                            ? now()->subWeeks(2)
                            : now()->subDays(3),
                    ])
                );
        }

        return $out;
    }

    private function seedGroups(string $tenantId, string $hqId, string $northId): void
    {
        $rows = [
            [
                'name' => 'Célula Centro — Plaza Independencia',
                'type' => 'cell',
                'campus_id' => $hqId,
                'leader_name' => 'Roberto Sánchez',
                'meeting_day' => 'Miércoles',
                'meeting_time' => '19:30',
                'address_line' => 'Peatonal Sarmiento 823',
                'city' => 'Mendoza Capital',
                'latitude' => -32.889458,
                'longitude' => -68.845838,
                'member_count' => 14,
                'weekly_topic' => 'Fe y comunidad',
            ],
            [
                'name' => 'Célula Familias — Quinta Sección',
                'type' => 'cell',
                'campus_id' => $northId,
                'leader_name' => 'Ana Ruiz',
                'meeting_day' => 'Jueves',
                'meeting_time' => '20:00',
                'address_line' => 'Av. España 1450',
                'city' => 'Mendoza Capital',
                'latitude' => -32.886214,
                'longitude' => -68.851732,
                'member_count' => 11,
            ],
            [
                'name' => 'Grupo Juvenil — Parque San Martín',
                'type' => 'youth',
                'campus_id' => $hqId,
                'leader_name' => 'Jorge Vega',
                'meeting_day' => 'Sábado',
                'meeting_time' => '17:00',
                'address_line' => 'Av. Emilio Civit 701',
                'city' => 'Mendoza Capital',
                'latitude' => -32.890712,
                'longitude' => -68.867845,
                'member_count' => 28,
            ],
            [
                'name' => 'Célula Acceso Sur',
                'type' => 'cell',
                'campus_id' => $hqId,
                'leader_name' => 'María González',
                'meeting_day' => 'Viernes',
                'meeting_time' => '20:30',
                'address_line' => 'Av. Acceso Sur 1240',
                'city' => 'Mendoza Capital',
                'latitude' => -32.902118,
                'longitude' => -68.838421,
                'member_count' => 9,
                'weekly_topic' => 'Oración y compañerismo',
            ],
        ];

        foreach ($rows as $row) {
            ChurchGroup::query()
                ->withoutGlobalScope(TenantScope::class)
                ->updateOrCreate(
                    ['tenant_id' => $tenantId, 'name' => $row['name']],
                    array_merge($row, ['status' => 'active'])
                );
        }
    }

    private function seedGatherings(string $tenantId, string $hqId, string $northId): void
    {
        $nextSunday = Carbon::now()->next(Carbon::SUNDAY)->setTime(10, 0);
        $lastSunday = Carbon::now()->previous(Carbon::SUNDAY)->setTime(10, 0);

        $rows = [
            [
                'title' => 'Culto dominical — Sede Central Mendoza',
                'type' => 'service',
                'status' => 'scheduled',
                'campus_id' => $hqId,
                'starts_at' => $nextSunday,
                'ends_at' => $nextSunday->copy()->addHours(2),
                'location' => 'Av. San Martín 1143, Mendoza Capital',
                'attendance_count' => 0,
                'checkin_enabled' => false,
            ],
            [
                'title' => 'Culto dominical — Sede Godoy Cruz',
                'type' => 'service',
                'status' => 'scheduled',
                'campus_id' => $northId,
                'starts_at' => $nextSunday->copy()->setTime(11, 30),
                'location' => 'Av. Bandera de los Andes 2607, Godoy Cruz',
                'checkin_enabled' => false,
            ],
            [
                'title' => 'Conferencia de liderazgo',
                'type' => 'event',
                'status' => 'scheduled',
                'campus_id' => $hqId,
                'starts_at' => Carbon::now()->addWeeks(2)->setTime(9, 0),
                'ends_at' => Carbon::now()->addWeeks(2)->setTime(14, 0),
                'location' => 'Sede Central Mendoza',
                'volunteers_needed' => 12,
                'checkin_enabled' => false,
            ],
            [
                'title' => 'Culto dominical (anterior)',
                'type' => 'service',
                'status' => 'completed',
                'campus_id' => $hqId,
                'starts_at' => $lastSunday,
                'ends_at' => $lastSunday->copy()->addHours(2),
                'location' => 'Av. San Martín 1143, Mendoza Capital',
                'attendance_count' => 387,
                'checkin_enabled' => false,
            ],
        ];

        foreach ($rows as $row) {
            ChurchGathering::query()
                ->withoutGlobalScope(TenantScope::class)
                ->updateOrCreate(
                    [
                        'tenant_id' => $tenantId,
                        'title' => $row['title'],
                        'starts_at' => $row['starts_at'],
                    ],
                    $row
                );
        }
    }

    private function seedFinanceTransactions(string $tenantId, string $hqId, string $northId): void
    {
        $categories = FinanceCategory::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->get()
            ->keyBy('name');

        $rows = [
            [
                'kind' => 'tithes',
                'amount' => 12500.00,
                'category' => 'Diezmos',
                'campus_id' => $hqId,
                'donor_name' => 'Ofrenda congregacional',
                'description' => 'Diezmos culto dominical',
                'days_ago' => 7,
            ],
            [
                'kind' => 'offering',
                'amount' => 4820.50,
                'category' => 'Ofrendas generales',
                'campus_id' => $hqId,
                'donor_name' => null,
                'description' => 'Ofrenda general',
                'days_ago' => 7,
            ],
            [
                'kind' => 'offering',
                'amount' => 2100.00,
                'category' => 'Ofrendas especiales',
                'campus_id' => $northId,
                'description' => 'Proyecto misiones locales',
                'days_ago' => 14,
            ],
            [
                'kind' => 'income',
                'amount' => 3500.00,
                'category' => 'Eventos',
                'campus_id' => $hqId,
                'description' => 'Inscripciones conferencia',
                'days_ago' => 3,
            ],
            [
                'kind' => 'expense',
                'amount' => 8900.00,
                'category' => 'Nómina y personal',
                'campus_id' => $hqId,
                'description' => 'Nómina quincenal',
                'days_ago' => 5,
            ],
            [
                'kind' => 'expense',
                'amount' => 1250.75,
                'category' => 'Instalaciones',
                'campus_id' => $hqId,
                'description' => 'Mantenimiento auditorio',
                'days_ago' => 10,
            ],
            [
                'kind' => 'expense',
                'amount' => 640.00,
                'category' => 'Ministerios',
                'campus_id' => $northId,
                'description' => 'Material ministerio niños',
                'days_ago' => 12,
            ],
        ];

        foreach ($rows as $row) {
            $category = $categories->get($row['category']);
            $occurredOn = now()->subDays($row['days_ago'])->toDateString();
            unset($row['category'], $row['days_ago']);

            FinanceTransaction::query()
                ->withoutGlobalScope(TenantScope::class)
                ->updateOrCreate(
                    [
                        'tenant_id' => $tenantId,
                        'reference' => 'demo-'.md5($row['description'].$occurredOn),
                        'occurred_on' => $occurredOn,
                    ],
                    array_merge($row, [
                        'category_id' => $category?->id,
                        'currency' => 'ARS',
                        'occurred_on' => $occurredOn,
                    ])
                );
        }
    }

    private function seedSpaces(string $tenantId, string $hqCampusId): void
    {
        $admin = User::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('email', 'admin@demo.com')
            ->first();

        if (! $admin) {
            return;
        }

        $demoCodes = [];
        $spacesData = [];

        /** 5 planos (pisos 1–5), 3 espacios por piso con layout espaciado (12 columnas) */
        $roomsPerFloor = [
            ['suffix' => 'SALON', 'name' => 'Salón principal', 'capacity' => 80, 'color' => '#2563eb', 'x' => 0, 'y' => 0, 'w' => 4, 'h' => 2],
            ['suffix' => 'AULA', 'name' => 'Aula', 'capacity' => 40, 'color' => '#16a34a', 'x' => 5, 'y' => 0, 'w' => 3, 'h' => 2],
            ['suffix' => 'SERV', 'name' => 'Servicios', 'capacity' => 15, 'color' => '#d97706', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 1],
        ];

        for ($floor = 1; $floor <= 5; $floor++) {
            foreach ($roomsPerFloor as $room) {
                $code = "F{$floor}-{$room['suffix']}";
                $demoCodes[] = $code;
                $spacesData[] = [
                    'code' => $code,
                    'name' => $room['name'],
                    'building' => 'Edificio central',
                    'floor' => (string) $floor,
                    'capacity' => $room['capacity'],
                    'status' => 'available',
                    'color' => $room['color'] ?? '#2563eb',
                    'amenities' => ["Piso {$floor}"],
                    'layout_x' => $room['x'],
                    'layout_y' => $room['y'],
                    'layout_w' => $room['w'],
                    'layout_h' => $room['h'],
                ];
            }
        }

        ChurchSpace::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->whereNotIn('code', $demoCodes)
            ->delete();

        foreach ($spacesData as $row) {
            ChurchSpace::query()
                ->withoutGlobalScope(TenantScope::class)
                ->updateOrCreate(
                    ['tenant_id' => $tenantId, 'code' => $row['code']],
                    array_merge($row, [
                        'campus_id' => $hqCampusId,
                        'min_booking_minutes' => 30,
                        'max_booking_minutes' => 240,
                        'requires_approval' => $row['requires_approval'] ?? false,
                    ])
                );
        }

        $piso1 = ChurchSpace::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('code', 'F1-SALON')
            ->first();

        $piso2 = ChurchSpace::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('code', 'F2-SALON')
            ->first();

        if (! $piso1 || ! $piso2) {
            return;
        }

        $nextSunday = now()->next(Carbon::SUNDAY)->setTime(10, 0);
        $nextSundayEnd = $nextSunday->copy()->addHours(2);

        ChurchSpaceReservation::query()
            ->withoutGlobalScope(TenantScope::class)
            ->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'church_space_id' => $piso1->id,
                    'title' => 'Culto dominical',
                    'starts_at' => $nextSunday,
                ],
                [
                    'user_id' => $admin->id,
                    'ends_at' => $nextSundayEnd,
                    'attendees_count' => 80,
                    'status' => 'confirmed',
                    'purpose' => 'Servicio principal',
                ]
            );

        $rehearsal = now()->addDays(2)->setTime(19, 0);
        ChurchSpaceReservation::query()
            ->withoutGlobalScope(TenantScope::class)
            ->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'church_space_id' => $piso2->id,
                    'title' => 'Ensayo alabanza',
                    'starts_at' => $rehearsal,
                ],
                [
                    'user_id' => $admin->id,
                    'ends_at' => $rehearsal->copy()->addHours(2),
                    'attendees_count' => 18,
                    'status' => 'confirmed',
                    'purpose' => 'Ministerio de música',
                ]
            );
    }

    /**
     * @param  array<string, Member>  $members
     */
    private function seedMemberTimelines(string $tenantId, array $members): void
    {
        if (! isset($members['sofia'], $members['miguel'])) {
            return;
        }

        MemberTimelineEvent::query()
            ->withoutGlobalScope(TenantScope::class)
            ->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'member_id' => $members['sofia']->id,
                    'type' => 'baptism',
                    'title' => 'Bautismo',
                ],
                [
                    'description' => 'Bautismo en culto dominical',
                    'event_at' => Carbon::parse('2022-04-20 11:00:00'),
                ]
            );

        MemberTimelineEvent::query()
            ->withoutGlobalScope(TenantScope::class)
            ->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'member_id' => $members['miguel']->id,
                    'type' => 'visit',
                    'title' => 'Primera visita',
                ],
                [
                    'description' => 'Asistió al culto dominical',
                    'event_at' => now()->subWeeks(2),
                ]
            );
    }
}
