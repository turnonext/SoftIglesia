<?php

namespace App\Modules\Course\Services;

use Carbon\Carbon;
use Carbon\CarbonPeriod;

class CourseStructureCalculator
{
    private const DAY_NAMES = [
        'monday' => Carbon::MONDAY,
        'tuesday' => Carbon::TUESDAY,
        'wednesday' => Carbon::WEDNESDAY,
        'thursday' => Carbon::THURSDAY,
        'friday' => Carbon::FRIDAY,
        'saturday' => Carbon::SATURDAY,
        'sunday' => Carbon::SUNDAY,
    ];

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function calculate(array $input): array
    {
        $start = Carbon::parse($input['start_date'])->startOfDay();
        $durationMeta = $this->resolveDuration($input);
        $end = $this->resolveEndDate($start, $input, $durationMeta);

        if ($end->lt($start)) {
            $end = $start->copy()->addMonths(3)->endOfDay();
        }

        $scheduleDays = array_values(array_unique(array_map(
            fn ($d) => strtolower((string) $d),
            $input['schedule_days'] ?? ['monday']
        )));
        $isoDays = array_values(array_filter(array_map(
            fn ($d) => self::DAY_NAMES[$d] ?? null,
            $scheduleDays
        )));

        $minutesPerClass = (int) ($input['minutes_per_class'] ?? 90);
        $dayTimesMap = $this->resolveScheduleDayTimes($input, $scheduleDays, $minutesPerClass);

        $slots = [];
        foreach (CarbonPeriod::create($start, $end) as $day) {
            if (in_array($day->dayOfWeekIso, $this->isoDaysFromNames($scheduleDays), true)) {
                $dayName = $this->isoToDayName($day->dayOfWeekIso);
                $slots[] = [
                    'date' => $day->format('Y-m-d'),
                    'day' => $dayName,
                ];
            }
        }

        $subjectsCount = max(1, (int) ($input['subjects_count'] ?? 1));
        $subjectsInput = $input['subjects'] ?? [];
        $subjects = $this->normalizeSubjects($subjectsInput, $subjectsCount);

        $generationMode = $input['generation_mode'] ?? 'auto';
        $classesPerSubject = isset($input['classes_per_subject'])
            ? (int) $input['classes_per_subject']
            : null;

        $classDistribution = $input['class_distribution'] ?? 'interleaved';
        if (! in_array($classDistribution, ['interleaved', 'block_by_subject'], true)) {
            $classDistribution = 'interleaved';
        }

        if ($generationMode === 'manual' && $classesPerSubject > 0) {
            $needed = $subjectsCount * $classesPerSubject;
            if (count($slots) >= $needed) {
                $slots = array_slice($slots, 0, $needed);
            } else {
                $slots = $this->padSlots($slots, $needed, $scheduleDays, $end);
            }
        }

        $totalClasses = count($slots);
        $subjectPlans = $this->distributeSlots(
            $slots,
            $subjectsCount,
            $subjects,
            $classDistribution,
            $generationMode,
            $classesPerSubject,
            $dayTimesMap
        );

        $firstDay = $scheduleDays[0] ?? 'monday';
        $classStartTime = $dayTimesMap[$firstDay]['start_time'] ?? '18:00';
        $classEndTime = $dayTimesMap[$firstDay]['end_time'] ?? null;

        $scheduleDayTimes = [];
        foreach ($scheduleDays as $day) {
            $scheduleDayTimes[] = [
                'day' => $day,
                'start_time' => $dayTimesMap[$day]['start_time'],
                'end_time' => $dayTimesMap[$day]['end_time'],
            ];
        }

        $weeks = max(1, (int) ceil($start->diffInDays($end) / 7));
        $sessionsPerWeek = count($isoDays) ?: 1;

        return [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'duration_unit' => $durationMeta['duration_unit'],
            'duration_weeks' => $durationMeta['duration_weeks'],
            'duration_months' => $durationMeta['duration_months'],
            'schedule_days' => $scheduleDays,
            'schedule_day_times' => $scheduleDayTimes,
            'class_start_time' => $classStartTime,
            'class_end_time' => $classEndTime,
            'minutes_per_class' => $minutesPerClass,
            'subjects_count' => $subjectsCount,
            'classes_per_subject' => $classesPerSubject,
            'generation_mode' => $generationMode,
            'class_distribution' => $classDistribution,
            'total_classes' => $totalClasses,
            'weeks_in_range' => $weeks,
            'sessions_per_week' => $sessionsPerWeek,
            'expected_classes_formula' => $weeks * $sessionsPerWeek,
            'subjects' => array_values($subjectPlans),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{duration_unit: string, duration_weeks: ?int, duration_months: ?int}
     */
    private function resolveDuration(array $input): array
    {
        $unit = $input['duration_unit'] ?? null;
        if ($unit === null) {
            $unit = ! empty($input['duration_weeks']) ? 'weeks' : 'months';
        }

        if ($unit === 'weeks') {
            $weeks = (int) ($input['duration_weeks'] ?? 1);
            if (! in_array($weeks, [1, 2, 3], true)) {
                $weeks = 1;
            }

            return [
                'duration_unit' => 'weeks',
                'duration_weeks' => $weeks,
                'duration_months' => null,
            ];
        }

        $months = (int) ($input['duration_months'] ?? 3);
        if (! in_array($months, [3, 6, 9, 12, 18, 24], true)) {
            $months = 3;
        }

        return [
            'duration_unit' => 'months',
            'duration_weeks' => null,
            'duration_months' => $months,
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array{duration_unit: string, duration_weeks: ?int, duration_months: ?int}  $durationMeta
     */
    private function resolveEndDate(Carbon $start, array $input, array $durationMeta): Carbon
    {
        if (! empty($input['end_date'])) {
            return Carbon::parse($input['end_date'])->endOfDay();
        }

        if ($durationMeta['duration_unit'] === 'weeks') {
            return $start->copy()
                ->addWeeks((int) $durationMeta['duration_weeks'])
                ->endOfDay();
        }

        return $start->copy()
            ->addMonths((int) $durationMeta['duration_months'])
            ->endOfDay();
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array<int, string>  $scheduleDays
     * @return array<string, array{start_time: string, end_time: string}>
     */
    private function resolveScheduleDayTimes(array $input, array $scheduleDays, int $minutesPerClass): array
    {
        $defaultStart = substr((string) ($input['class_start_time'] ?? '18:00'), 0, 5);
        $map = [];

        foreach ($input['schedule_day_times'] ?? [] as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $day = strtolower((string) ($entry['day'] ?? ''));
            if (! isset(self::DAY_NAMES[$day])) {
                continue;
            }
            $start = substr((string) ($entry['start_time'] ?? $defaultStart), 0, 5);
            $end = isset($entry['end_time']) ? substr((string) $entry['end_time'], 0, 5) : null;
            if (! $end) {
                $end = Carbon::parse($start)->addMinutes($minutesPerClass)->format('H:i');
            }
            $map[$day] = ['start_time' => $start, 'end_time' => $end];
        }

        foreach ($scheduleDays as $day) {
            if (! isset($map[$day])) {
                $map[$day] = [
                    'start_time' => $defaultStart,
                    'end_time' => Carbon::parse($defaultStart)->addMinutes($minutesPerClass)->format('H:i'),
                ];
            }
        }

        return $map;
    }

    /**
     * @param  array<int, array{date: string, day: string}>  $slots
     * @param  array<int, array{name: string}>  $subjects
     * @param  array<string, array{start_time: string, end_time: string}>  $dayTimesMap
     * @return array<int, array<string, mixed>>
     */
    private function distributeSlots(
        array $slots,
        int $subjectsCount,
        array $subjects,
        string $distribution,
        string $generationMode,
        ?int $classesPerSubject,
        array $dayTimesMap
    ): array {
        $subjectPlans = [];
        foreach ($subjects as $i => $subject) {
            $subjectPlans[$i] = [
                'name' => $subject['name'],
                'sort_order' => $i,
                'classes_count' => 0,
                'class_dates' => [],
                'class_sessions' => [],
            ];
        }

        if ($slots === []) {
            return $subjectPlans;
        }

        if ($distribution === 'block_by_subject') {
            $offset = 0;
            for ($s = 0; $s < $subjectsCount; $s++) {
                if ($generationMode === 'manual' && $classesPerSubject > 0) {
                    $count = $classesPerSubject;
                } else {
                    $total = count($slots);
                    $base = intdiv($total, $subjectsCount);
                    $remainder = $total % $subjectsCount;
                    $count = $base + ($s < $remainder ? 1 : 0);
                }

                for ($c = 0; $c < $count && $offset < count($slots); $c++) {
                    $this->appendClassSession($subjectPlans[$s], $slots[$offset++], $dayTimesMap);
                }
                $subjectPlans[$s]['classes_count'] = count($subjectPlans[$s]['class_sessions']);
            }

            return $subjectPlans;
        }

        foreach ($slots as $idx => $slot) {
            $subjectIdx = $idx % $subjectsCount;
            $this->appendClassSession($subjectPlans[$subjectIdx], $slot, $dayTimesMap);
        }

        foreach ($subjectPlans as $i => &$plan) {
            $plan['classes_count'] = count($plan['class_sessions']);
        }
        unset($plan);

        return $subjectPlans;
    }

    /**
     * @param  array<string, mixed>  $plan
     * @param  array{date: string, day: string}|string  $slot
     * @param  array<string, array{start_time: string, end_time: string}>  $dayTimesMap
     */
    private function appendClassSession(array &$plan, array|string $slot, array $dayTimesMap): void
    {
        if (is_array($slot)) {
            $date = $slot['date'];
            $day = $slot['day'] ?? $this->weekdayNameFromDate($date);
        } else {
            $date = $slot;
            $day = $this->weekdayNameFromDate($date);
        }

        $times = $dayTimesMap[$day] ?? reset($dayTimesMap) ?: [
            'start_time' => '18:00',
            'end_time' => '19:30',
        ];

        $session = [
            'date' => $date,
            'day' => $day,
            'start_time' => $times['start_time'],
            'end_time' => $times['end_time'],
        ];

        $plan['class_sessions'][] = $session;
        $plan['class_dates'][] = $date;
    }

    private function weekdayNameFromDate(string $date): string
    {
        return $this->isoToDayName(Carbon::parse($date)->dayOfWeekIso);
    }

    private function isoToDayName(int $iso): string
    {
        foreach (self::DAY_NAMES as $name => $value) {
            if ($value === $iso) {
                return $name;
            }
        }

        return 'monday';
    }

    /** @param  array<int, array{name: string}>  $subjectsInput */
    private function normalizeSubjects(array $subjectsInput, int $count): array
    {
        $subjects = [];
        for ($i = 0; $i < $count; $i++) {
            $subjects[] = [
                'name' => trim($subjectsInput[$i]['name'] ?? '') ?: 'Materia '.($i + 1),
            ];
        }

        return $subjects;
    }

    /** @param  array<int, string>  $scheduleDays */
    private function isoDaysFromNames(array $scheduleDays): array
    {
        $iso = [];
        foreach ($scheduleDays as $name) {
            if (isset(self::DAY_NAMES[$name])) {
                $iso[] = self::DAY_NAMES[$name];
            }
        }

        return $iso ?: [Carbon::MONDAY];
    }

    /**
     * @param  array<int, array{date: string, day: string}>  $slots
     * @param  array<int, string>  $scheduleDays
     * @return array<int, array{date: string, day: string}>
     */
    private function padSlots(array $slots, int $needed, array $scheduleDays, Carbon $end): array
    {
        if ($slots === []) {
            $today = now();
            $slots[] = [
                'date' => $today->toDateString(),
                'day' => $this->isoToDayName($today->dayOfWeekIso),
            ];
        }
        $last = end($slots);
        $cursor = Carbon::parse(is_array($last) ? $last['date'] : $last);
        $isoDays = $this->isoDaysFromNames($scheduleDays);

        while (count($slots) < $needed && $cursor->lte($end->copy()->addMonths(2))) {
            $cursor->addDay();
            if (in_array($cursor->dayOfWeekIso, $isoDays, true)) {
                $slots[] = [
                    'date' => $cursor->format('Y-m-d'),
                    'day' => $this->isoToDayName($cursor->dayOfWeekIso),
                ];
            }
        }

        return array_slice($slots, 0, $needed);
    }
}
