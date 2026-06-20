<?php

namespace App\Modules\ChurchSpaces\Http\Controllers;

use App\Modules\ChurchSpaces\Models\ChurchSpace;
use App\Modules\ChurchSpaces\Services\SpaceReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;

class SpaceAvailabilityController extends Controller
{
    public function __construct(private readonly SpaceReservationService $reservations) {}

    public function index(Request $request): JsonResponse
    {
        $dateInput = $request->query('date', now()->toDateString());
        $date = Carbon::parse($dateInput)->startOfDay();
        $spaceId = $request->query('space_id');

        $spaces = ChurchSpace::query()
            ->when($spaceId, fn ($q) => $q->where('id', $spaceId))
            ->orderBy('name')
            ->get();

        $data = $spaces->map(function (ChurchSpace $space) use ($date) {
            $active = $this->reservations->activeReservationsForDate($space, $date);

            return [
                'id' => $space->id,
                'name' => $space->name,
                'code' => $space->code,
                'capacity' => $space->capacity,
                'status' => $space->status,
                'color' => $space->color,
                'bookable' => $space->isBookable(),
                'reservations' => collect($active)->map(function ($r) use ($date) {
                    $occurrence = $r->isFixedSchedule()
                        ? $r->occurrenceOnDate($date)
                        : null;

                    return [
                        'id' => $r->id,
                        'title' => $r->title,
                        'starts_at' => ($occurrence['starts_at'] ?? $r->starts_at)?->toIso8601String(),
                        'ends_at' => ($occurrence['ends_at'] ?? $r->ends_at)?->toIso8601String(),
                        'status' => $r->status,
                        'attendees_count' => $r->attendees_count,
                        'recurrence_series_id' => $r->recurrence_series_id,
                        'recurrence_weekday' => $r->recurrence_weekday,
                        'recurrence_interval_weeks' => $r->recurrence_interval_weeks,
                    ];
                })->values(),
                'slots' => $this->reservations->buildDaySlots($space, $date),
            ];
        })->values();

        return response()->json([
            'data' => [
                'date' => $date->toDateString(),
                'fixed_schedules' => $this->reservations->listFixedSchedules($date),
                'spaces' => $data,
            ],
            'meta' => [
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function check(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'church_space_id' => ['required', 'string', 'max:26'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'attendees_count' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'exclude_reservation_id' => ['nullable', 'string', 'max:26'],
        ]);

        $space = ChurchSpace::query()->findOrFail($payload['church_space_id']);
        $startsAt = Carbon::parse($payload['starts_at']);
        $endsAt = Carbon::parse($payload['ends_at']);
        $attendees = (int) ($payload['attendees_count'] ?? 1);

        try {
            $this->reservations->assertCanBook(
                $space,
                $startsAt,
                $endsAt,
                $attendees,
                $payload['exclude_reservation_id'] ?? null
            );
            $available = true;
            $message = 'El horario está disponible.';
        } catch (\Illuminate\Validation\ValidationException $e) {
            $available = false;
            $message = collect($e->errors())->flatten()->first() ?? 'No disponible.';
        }

        return response()->json([
            'data' => [
                'available' => $available,
                'message' => $message,
            ],
        ]);
    }
}
