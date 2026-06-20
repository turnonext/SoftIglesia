<?php

namespace App\Modules\ChurchSeatEvents\Services;

class SeatLayoutService
{
    public function rowLabel(int $rowIndex): string
    {
        $label = '';
        $n = $rowIndex;

        do {
            $label = chr(65 + ($n % 26)).$label;
            $n = intdiv($n, 26) - 1;
        } while ($n >= 0);

        return $label;
    }

    /**
     * @param  array<int, array{name: string, row_count: int, seats_per_row: int, layout_placement?: string}>  $sectors
     * @return array<int, array{sector: array<string, mixed>, seats: array<int, array<string, mixed>>}>
     */
    public function buildSeatDefinitions(array $sectors): array
    {
        $definitions = [];
        $sectorOrder = 0;

        foreach ($sectors as $sectorConfig) {
            $seats = [];
            $seatOrder = 0;

            for ($row = 0; $row < $sectorConfig['row_count']; $row++) {
                $rowLabel = $this->rowLabel($row);

                for ($seatNum = 1; $seatNum <= $sectorConfig['seats_per_row']; $seatNum++) {
                    $label = $rowLabel.$seatNum;
                    $seats[] = [
                        'row_label' => $rowLabel,
                        'seat_number' => $seatNum,
                        'label' => $label,
                        'sort_order' => $seatOrder++,
                    ];
                }
            }

            $definitions[] = [
                'sector' => [
                    'name' => $sectorConfig['name'],
                    'row_count' => $sectorConfig['row_count'],
                    'seats_per_row' => $sectorConfig['seats_per_row'],
                    'sort_order' => $sectorOrder,
                    'layout_placement' => $sectorOrder === 0
                        ? 'below'
                        : ($sectorConfig['layout_placement'] ?? 'below'),
                ],
                'seats' => $seats,
            ];

            $sectorOrder++;
        }

        return $definitions;
    }
}
