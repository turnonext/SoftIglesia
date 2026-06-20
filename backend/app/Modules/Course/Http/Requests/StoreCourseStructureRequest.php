<?php

namespace App\Modules\Course\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['instructor', 'admin'], true);
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('class_start_time') && is_string($this->input('class_start_time'))) {
            $merge['class_start_time'] = substr($this->input('class_start_time'), 0, 5);
        }
        if ($this->has('class_end_time') && is_string($this->input('class_end_time'))) {
            $merge['class_end_time'] = substr($this->input('class_end_time'), 0, 5);
        }
        if ($this->has('schedule_day_times') && is_array($this->input('schedule_day_times'))) {
            $normalized = [];
            foreach ($this->input('schedule_day_times') as $entry) {
                if (! is_array($entry)) {
                    continue;
                }
                $normalized[] = [
                    'day' => strtolower((string) ($entry['day'] ?? '')),
                    'start_time' => isset($entry['start_time'])
                        ? substr((string) $entry['start_time'], 0, 5)
                        : null,
                    'end_time' => isset($entry['end_time'])
                        ? substr((string) $entry['end_time'], 0, 5)
                        : null,
                ];
            }
            $merge['schedule_day_times'] = $normalized;
        }
        if ($this->has('duration_months')) {
            $merge['duration_months'] = (int) $this->input('duration_months');
        }
        if ($this->has('duration_weeks')) {
            $merge['duration_weeks'] = (int) $this->input('duration_weeks');
        }
        if ($this->has('subjects_count')) {
            $merge['subjects_count'] = (int) $this->input('subjects_count');
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'duration_unit' => ['nullable', Rule::in(['weeks', 'months'])],
            'duration_weeks' => ['nullable', 'integer', Rule::in([1, 2, 3])],
            'duration_months' => ['nullable', 'integer', Rule::in([3, 6, 9, 12, 18, 24])],
            'class_distribution' => ['nullable', Rule::in(['interleaved', 'block_by_subject'])],
            'schedule_days' => ['required', 'array', 'min:1'],
            'schedule_days.*' => [Rule::in(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])],
            'schedule_day_times' => ['nullable', 'array'],
            'schedule_day_times.*.day' => ['required', Rule::in(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])],
            'schedule_day_times.*.start_time' => ['required', 'regex:/^\d{2}:\d{2}$/'],
            'schedule_day_times.*.end_time' => ['nullable', 'regex:/^\d{2}:\d{2}$/'],
            'class_start_time' => ['required_without:schedule_day_times', 'nullable', 'regex:/^\d{2}:\d{2}$/'],
            'class_end_time' => ['nullable', 'regex:/^\d{2}:\d{2}$/'],
            'minutes_per_class' => ['nullable', 'integer', 'min:30', 'max:480'],
            'subjects_count' => ['required', 'integer', 'min:1', 'max:20'],
            'subjects' => ['nullable', 'array'],
            'subjects.*.name' => ['nullable', 'string', 'max:120'],
            'classes_per_subject' => ['nullable', 'integer', 'min:1', 'max:500'],
            'generation_mode' => ['nullable', Rule::in(['auto', 'manual'])],
            'class_provider' => ['nullable', Rule::in(['zoom', 'meet', 'onsite'])],
            'file_links' => ['nullable', 'array'],
            'file_links.*.file_id' => ['required_with:file_links', 'ulid'],
            'file_links.*.scope' => ['nullable', Rule::in(['course', 'subject'])],
            'file_links.*.subject_index' => ['nullable', 'integer', 'min:0'],
            'file_links.*.label' => ['nullable', 'string', 'max:255'],
        ];
    }
}
