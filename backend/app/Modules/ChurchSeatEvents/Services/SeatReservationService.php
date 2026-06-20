<?php

namespace App\Modules\ChurchSeatEvents\Services;

use App\Modules\ChurchSeatEvents\Models\ChurchSeatEvent;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEventReservation;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEventSeat;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SeatReservationService
{
    public function __construct(
        private readonly SeatLayoutService $layout,
    ) {}

    public function releaseExpiredHolds(ChurchSeatEvent $event): void
    {
        ChurchSeatEventReservation::query()
            ->where('church_seat_event_id', $event->id)
            ->where('status', 'held')
            ->where('held_until', '<', now())
            ->delete();
    }

    /**
     * @return array<int, array{id: string, label: string, sector_id: string, sector_name: string, row_label: string, seat_number: int, display_status: string}>
     */
    public function seatStatusMap(ChurchSeatEvent $event, ?string $sessionToken = null): array
    {
        $this->releaseExpiredHolds($event);

        $seats = ChurchSeatEventSeat::query()
            ->where('church_seat_event_id', $event->id)
            ->with('sector:id,name')
            ->orderBy('sort_order')
            ->get();

        $activeReservations = ChurchSeatEventReservation::query()
            ->where('church_seat_event_id', $event->id)
            ->whereIn('status', ['held', 'confirmed'])
            ->get()
            ->keyBy('church_seat_event_seat_id');

        return $seats->map(function (ChurchSeatEventSeat $seat) use ($activeReservations, $sessionToken) {
            $displayStatus = 'available';

            if ($seat->isBlocked()) {
                $displayStatus = 'blocked';
            } else {
                $reservation = $activeReservations->get($seat->id);

                if ($reservation) {
                    if ($reservation->status === 'confirmed') {
                        $displayStatus = 'reserved';
                    } elseif ($reservation->isHeld()) {
                        $displayStatus = $sessionToken && $reservation->session_token === $sessionToken
                            ? 'selected'
                            : 'reserved';
                    }
                }
            }

            return [
                'id' => $seat->id,
                'label' => $seat->label,
                'sector_id' => $seat->church_seat_event_sector_id,
                'sector_name' => $seat->sector?->name ?? '',
                'row_label' => $seat->row_label,
                'seat_number' => $seat->seat_number,
                'display_status' => $displayStatus,
            ];
        })->values()->all();
    }

    public function holdSeat(ChurchSeatEvent $event, string $seatId, string $sessionToken): ChurchSeatEventReservation
    {
        if (! $event->isAcceptingReservations()) {
            throw ValidationException::withMessages([
                'event' => ['Las reservas no están disponibles para este evento.'],
            ]);
        }

        return DB::transaction(function () use ($event, $seatId, $sessionToken) {
            $this->releaseExpiredHolds($event);

            $seat = ChurchSeatEventSeat::query()
                ->where('church_seat_event_id', $event->id)
                ->whereKey($seatId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($seat->isBlocked()) {
                throw ValidationException::withMessages([
                    'seat' => ['Este asiento está bloqueado.'],
                ]);
            }

            $existingBySession = ChurchSeatEventReservation::query()
                ->where('church_seat_event_id', $event->id)
                ->where('session_token', $sessionToken)
                ->whereIn('status', ['held', 'confirmed'])
                ->lockForUpdate()
                ->get();

            $sessionConfirmedCount = 0;
            foreach ($existingBySession as $existing) {
                if ($existing->status === 'confirmed') {
                    $sessionConfirmedCount++;
                } elseif ($existing->status === 'held') {
                    $existing->delete();
                }
            }

            if ($event->hasReservationLimit() && $sessionConfirmedCount >= $event->max_reservations_per_user) {
                throw ValidationException::withMessages([
                    'seat' => ['Ya alcanzaste el máximo de reservas permitidas para este evento.'],
                ]);
            }

            $activeOnSeat = ChurchSeatEventReservation::query()
                ->where('church_seat_event_seat_id', $seat->id)
                ->whereIn('status', ['held', 'confirmed'])
                ->lockForUpdate()
                ->first();

            if ($activeOnSeat) {
                if ($activeOnSeat->status === 'confirmed') {
                    throw ValidationException::withMessages([
                        'seat' => ['Este asiento ya está reservado.'],
                    ]);
                }

                if ($activeOnSeat->session_token !== $sessionToken) {
                    throw ValidationException::withMessages([
                        'seat' => ['Otra persona está reservando este asiento.'],
                    ]);
                }

                $activeOnSeat->update([
                    'held_until' => now()->addMinutes($event->hold_minutes),
                ]);

                return $activeOnSeat->fresh();
            }

            return ChurchSeatEventReservation::query()->create([
                'church_seat_event_id' => $event->id,
                'church_seat_event_seat_id' => $seat->id,
                'session_token' => $sessionToken,
                'status' => 'held',
                'held_until' => now()->addMinutes($event->hold_minutes),
            ]);
        });
    }

    public function releaseHold(ChurchSeatEvent $event, string $sessionToken, ?string $seatId = null): void
    {
        $query = ChurchSeatEventReservation::query()
            ->where('church_seat_event_id', $event->id)
            ->where('session_token', $sessionToken)
            ->where('status', 'held');

        if ($seatId) {
            $query->where('church_seat_event_seat_id', $seatId);
        }

        $query->delete();
    }

    /**
     * @param  array{attendee_name: string, attendee_email: string, attendee_phone?: string|null}  $attendee
     */
    public function confirmReservation(
        ChurchSeatEvent $event,
        string $sessionToken,
        string $seatId,
        array $attendee,
    ): ChurchSeatEventReservation {
        if (! $event->isAcceptingReservations()) {
            throw ValidationException::withMessages([
                'event' => ['Las reservas no están disponibles para este evento.'],
            ]);
        }

        return DB::transaction(function () use ($event, $sessionToken, $seatId, $attendee) {
            $this->releaseExpiredHolds($event);

            $hold = ChurchSeatEventReservation::query()
                ->where('church_seat_event_id', $event->id)
                ->where('church_seat_event_seat_id', $seatId)
                ->where('session_token', $sessionToken)
                ->where('status', 'held')
                ->lockForUpdate()
                ->first();

            if (! $hold || ! $hold->isHeld()) {
                throw ValidationException::withMessages([
                    'seat' => ['La selección del asiento expiró. Elige un asiento nuevamente.'],
                ]);
            }

            $email = strtolower(trim($attendee['attendee_email']));
            $this->assertCanReserve($event, $email, $sessionToken);

            $hold->update([
                'attendee_name' => $attendee['attendee_name'],
                'attendee_email' => $attendee['attendee_email'],
                'attendee_phone' => $attendee['attendee_phone'] ?? null,
                'status' => 'confirmed',
                'held_until' => null,
                'confirmed_at' => now(),
                'confirmation_code' => strtoupper(Str::random(8)),
            ]);

            return $hold->fresh(['seat.sector']);
        });
    }

    public function toggleSeatBlocked(ChurchSeatEventSeat $seat): ChurchSeatEventSeat
    {
        if ($seat->status === 'blocked') {
            $hasActive = ChurchSeatEventReservation::query()
                ->where('church_seat_event_seat_id', $seat->id)
                ->whereIn('status', ['held', 'confirmed'])
                ->exists();

            if ($hasActive) {
                throw ValidationException::withMessages([
                    'seat' => ['No se puede desbloquear un asiento con reserva activa.'],
                ]);
            }

            $seat->update(['status' => 'available']);
        } else {
            ChurchSeatEventReservation::query()
                ->where('church_seat_event_seat_id', $seat->id)
                ->where('status', 'held')
                ->delete();

            $seat->update(['status' => 'blocked']);
        }

        return $seat->fresh();
    }

    public function countConfirmedForEmail(ChurchSeatEvent $event, string $email): int
    {
        return ChurchSeatEventReservation::query()
            ->where('church_seat_event_id', $event->id)
            ->where('status', 'confirmed')
            ->whereRaw('LOWER(attendee_email) = ?', [strtolower(trim($email))])
            ->count();
    }

    public function countConfirmedForSession(ChurchSeatEvent $event, string $sessionToken): int
    {
        return ChurchSeatEventReservation::query()
            ->where('church_seat_event_id', $event->id)
            ->where('session_token', $sessionToken)
            ->where('status', 'confirmed')
            ->count();
    }

    public function assertCanReserve(ChurchSeatEvent $event, string $email, string $sessionToken): void
    {
        if (! $event->hasReservationLimit()) {
            return;
        }

        $limit = $event->max_reservations_per_user;
        $byEmail = $this->countConfirmedForEmail($event, $email);
        $bySession = $this->countConfirmedForSession($event, $sessionToken);

        if ($byEmail >= $limit || $bySession >= $limit) {
            throw ValidationException::withMessages([
                'attendee_email' => [
                    "Este correo ya alcanzó el máximo de {$limit} reserva(s) permitida(s) para este evento.",
                ],
            ]);
        }
    }
}
