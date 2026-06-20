<?php

namespace App\Modules\ChurchSeatEvents\Services;

use App\Modules\ChurchSeatEvents\Models\ChurchSeatEvent;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEventReservation;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEventSector;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEventSeat;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SeatEventService
{
    public function __construct(
        private readonly SeatLayoutService $layout,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, array{name: string, row_count: int, seats_per_row: int}>  $sectors
     */
    public function create(array $payload, array $sectors): ChurchSeatEvent
    {
        return DB::transaction(function () use ($payload, $sectors) {
            $event = ChurchSeatEvent::query()->create([
                ...$payload,
                'reservation_token' => $this->generateToken(),
                'token_version' => 1,
                'status' => $payload['status'] ?? 'active',
                'max_reservations_per_user' => $payload['max_reservations_per_user'] ?? 1,
            ]);

            $this->syncSectors($event, $sectors);

            return $event->load(['space:id,name,code', 'sectors']);
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, array{name: string, row_count: int, seats_per_row: int}>|null  $sectors
     */
    public function update(ChurchSeatEvent $event, array $payload, ?array $sectors = null): ChurchSeatEvent
    {
        return DB::transaction(function () use ($event, $payload, $sectors) {
            $hasReservations = $event->reservations()
                ->whereIn('status', ['held', 'confirmed'])
                ->exists();

            if ($sectors !== null && $hasReservations) {
                throw ValidationException::withMessages([
                    'sectors' => ['No se puede modificar el layout con reservas activas.'],
                ]);
            }

            $event->update($payload);

            if ($sectors !== null) {
                $this->syncSectors($event, $sectors);
            }

            return $event->fresh(['space:id,name,code', 'sectors']);
        });
    }

    public function regenerateToken(ChurchSeatEvent $event): ChurchSeatEvent
    {
        $event->update([
            'reservation_token' => $this->generateToken(),
            'token_version' => $event->token_version + 1,
        ]);

        return $event->fresh();
    }

    public function toggleReservationsPaused(ChurchSeatEvent $event): ChurchSeatEvent
    {
        $event->update(['reservations_paused' => ! $event->reservations_paused]);

        if ($event->reservations_paused) {
            ChurchSeatEventReservation::query()
                ->where('church_seat_event_id', $event->id)
                ->where('status', 'held')
                ->delete();
        }

        return $event->fresh();
    }

    public function deactivate(ChurchSeatEvent $event): ChurchSeatEvent
    {
        ChurchSeatEventReservation::query()
            ->where('church_seat_event_id', $event->id)
            ->where('status', 'held')
            ->delete();

        $event->update([
            'status' => 'finished',
            'reservations_paused' => true,
        ]);

        return $event->fresh();
    }

    public function reactivate(ChurchSeatEvent $event): ChurchSeatEvent
    {
        $event->update([
            'status' => 'active',
            'reservations_paused' => false,
        ]);

        return $event->fresh();
    }

    public function deleteEvent(ChurchSeatEvent $event): void
    {
        $event->delete();
    }

    /**
     * @param  array<int, array{name: string, row_count: int, seats_per_row: int}>  $sectors
     */
    private function syncSectors(ChurchSeatEvent $event, array $sectors): void
    {
        ChurchSeatEventSeat::query()->where('church_seat_event_id', $event->id)->delete();
        ChurchSeatEventSector::query()->where('church_seat_event_id', $event->id)->delete();

        $definitions = $this->layout->buildSeatDefinitions($sectors);

        foreach ($definitions as $definition) {
            $sector = ChurchSeatEventSector::query()->create([
                'church_seat_event_id' => $event->id,
                ...$definition['sector'],
            ]);

            foreach ($definition['seats'] as $seatData) {
                ChurchSeatEventSeat::query()->create([
                    'church_seat_event_id' => $event->id,
                    'church_seat_event_sector_id' => $sector->id,
                    'status' => 'available',
                    ...$seatData,
                ]);
            }
        }
    }

    private function generateToken(): string
    {
        return Str::random(48);
    }

    public function eventSummary(ChurchSeatEvent $event): array
    {
        $totalSeats = $event->seats()->count();
        $blockedSeats = $event->seats()->where('status', 'blocked')->count();
        $confirmed = $event->reservations()->where('status', 'confirmed')->count();
        $held = $event->reservations()
            ->where('status', 'held')
            ->where('held_until', '>', now())
            ->count();

        return [
            'total_seats' => $totalSeats,
            'blocked_seats' => $blockedSeats,
            'confirmed_reservations' => $confirmed,
            'active_holds' => $held,
            'available_seats' => max(0, $totalSeats - $blockedSeats - $confirmed - $held),
        ];
    }
}
