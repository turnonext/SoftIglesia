<?php

namespace App\Modules\Auth\Services;

use App\Modules\Auth\Models\PasswordReset;
use App\Modules\Auth\Models\User;
use Illuminate\Support\Str;

class PasswordResetService
{
    public function issue(User $user): string
    {
        $plain = Str::random(64);

        PasswordReset::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        PasswordReset::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addHour(),
        ]);

        return $plain;
    }

    public function consume(string $plain): ?PasswordReset
    {
        $row = PasswordReset::query()
            ->where('token_hash', hash('sha256', $plain))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $row) {
            return null;
        }

        $row->update(['used_at' => now()]);

        return $row;
    }
}
