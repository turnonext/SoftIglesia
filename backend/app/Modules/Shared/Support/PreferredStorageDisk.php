<?php

namespace App\Modules\Shared\Support;

use Illuminate\Support\Facades\Storage;

final class PreferredStorageDisk
{
    public static function resolve(): string
    {
        if (config('filesystems.default') === 's3' && self::s3AdapterAvailable()) {
            try {
                Storage::disk('s3')->directories('/');

                return 's3';
            } catch (\Throwable) {
                //
            }
        }

        return 'public';
    }

    public static function s3AdapterAvailable(): bool
    {
        return class_exists(\League\Flysystem\AwsS3V3\PortableVisibilityConverter::class);
    }
}
