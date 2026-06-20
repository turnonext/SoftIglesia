<?php

namespace App\Modules\ChurchSeatEvents\Http\Controllers;

use App\Modules\ChurchSeatEvents\Http\Requests\ConfirmSeatReservationRequest;
use App\Modules\ChurchSeatEvents\Models\ChurchSeatEvent;
use App\Modules\ChurchSeatEvents\Services\SeatReservationCaptchaService;
use App\Modules\ChurchSeatEvents\Services\SeatReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PublicSeatReservationController extends Controller
{
    public function __construct(
        private readonly SeatReservationService $reservations,
        private readonly SeatReservationCaptchaService $captcha,
    ) {}

    public function show(Request $request): JsonResponse
    {
        /** @var ChurchSeatEvent $event */
        $event = $request->attributes->get('seat_event');
        $event->load(['space:id,name,code,building,floor', 'sectors']);

        return response()->json([
            'data' => [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'starts_at' => $event->starts_at,
                'ends_at' => $event->ends_at,
                'status' => $event->status,
                'reservations_paused' => $event->reservations_paused,
                'hold_minutes' => $event->hold_minutes,
                'max_reservations_per_user' => $event->max_reservations_per_user,
                'accepting_reservations' => $event->isAcceptingReservations(),
                'reservation_closed_reason' => $event->reservationClosedReason(),
                'space' => $event->space,
                'sectors' => $event->sectors,
            ],
        ]);
    }

    public function seatStatus(Request $request): JsonResponse
    {
        /** @var ChurchSeatEvent $event */
        $event = $request->attributes->get('seat_event');
        $sessionToken = (string) $request->query('session_token', '');

        return response()->json([
            'data' => $this->reservations->seatStatusMap(
                $event,
                $sessionToken !== '' ? $sessionToken : null,
            ),
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function hold(Request $request): JsonResponse
    {
        /** @var ChurchSeatEvent $event */
        $event = $request->attributes->get('seat_event');

        $request->validate([
            'session_token' => ['required', 'string', 'max:64'],
            'seat_id' => ['required', 'string'],
        ]);

        $hold = $this->reservations->holdSeat(
            $event,
            $request->string('seat_id')->toString(),
            $request->string('session_token')->toString(),
        );

        return response()->json([
            'data' => $hold,
            'seats' => $this->reservations->seatStatusMap($event, $request->string('session_token')->toString()),
        ]);
    }

    public function release(Request $request): JsonResponse
    {
        /** @var ChurchSeatEvent $event */
        $event = $request->attributes->get('seat_event');

        $request->validate([
            'session_token' => ['required', 'string', 'max:64'],
            'seat_id' => ['nullable', 'string'],
        ]);

        $this->reservations->releaseHold(
            $event,
            $request->string('session_token')->toString(),
            $request->input('seat_id'),
        );

        return response()->json([
            'seats' => $this->reservations->seatStatusMap($event, $request->string('session_token')->toString()),
            'message' => 'Selección liberada.',
        ]);
    }

    public function captcha(Request $request): JsonResponse
    {
        $request->validate([
            'session_token' => ['required', 'string', 'max:64'],
        ]);

        $challenge = $this->captcha->create($request->string('session_token')->toString());

        return response()->json(['data' => $challenge]);
    }

    public function confirm(ConfirmSeatReservationRequest $request): JsonResponse
    {
        /** @var ChurchSeatEvent $event */
        $event = $request->attributes->get('seat_event');
        $validated = $request->validated();

        $this->captcha->verify(
            $validated['captcha_id'],
            (int) $validated['captcha_answer'],
            $validated['session_token'],
        );

        $reservation = $this->reservations->confirmReservation(
            $event,
            $validated['session_token'],
            $validated['seat_id'],
            [
                'attendee_name' => $validated['attendee_name'],
                'attendee_email' => $validated['attendee_email'],
                'attendee_phone' => $validated['attendee_phone'] ?? null,
            ],
        );

        return response()->json([
            'data' => $reservation,
            'user_confirmed_count' => $this->reservations->countConfirmedForSession(
                $event,
                $validated['session_token']
            ),
            'remaining_reservations' => $event->hasReservationLimit()
                ? max(0, $event->max_reservations_per_user - $this->reservations->countConfirmedForSession(
                    $event,
                    $validated['session_token']
                ))
                : null,
            'message' => 'Reserva confirmada.',
        ]);
    }
}
