<?php

namespace App\Modules\Shared\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WriteToOutbox implements ShouldQueue
{
    public function handle(object $event): void
    {
        $payload = method_exists($event, 'toArray') ? $event->toArray() : (array) $event;
        $aggregate = $this->resolveAggregate($event);

        DB::table('event_outbox')->insert([
            'id' => (string) Str::ulid(),
            'tenant_id' => $aggregate['tenant_id'] ?? null,
            'aggregate_type' => $aggregate['type'],
            'aggregate_id' => $aggregate['id'] ?? null,
            'event_name' => class_basename($event),
            'event_version' => 1,
            'payload' => json_encode($payload),
            'correlation_id' => request()->header('X-Correlation-ID'),
            'idempotency_key' => Str::uuid()->toString(),
            'status' => 'pending',
            'created_at' => now(),
        ]);
    }

    private function resolveAggregate(object $event): array
    {
        foreach ((array) $event as $property) {
            if ($property instanceof Model) {
                return [
                    'type' => class_basename($property),
                    'id' => $property->getKey(),
                    'tenant_id' => $property->tenant_id ?? null,
                ];
            }
        }

        return ['type' => 'Unknown', 'id' => null, 'tenant_id' => null];
    }
}
