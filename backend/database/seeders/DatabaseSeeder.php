<?php

namespace Database\Seeders;

use App\Modules\Auth\Models\User;
use App\Modules\Shared\Models\Tenant;
use App\Modules\Shared\Scopes\TenantScope;
use App\Modules\User\Models\UserProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->firstOrCreate(
            ['slug' => 'demo'],
            [
                'name' => 'Iglesia Demo Mendoza',
                'domain' => 'demo.localhost',
                'plan' => 'enterprise',
                'is_active' => true,
            ]
        );

        Tenant::query()->firstOrCreate(
            ['slug' => 'acme'],
            [
                'name' => 'Acme Learning',
                'domain' => 'acme.localhost',
                'plan' => 'trial',
                'is_active' => true,
            ]
        );

        $platformTenant = Tenant::query()->firstOrCreate(
            ['slug' => 'platform'],
            [
                'name' => 'Plataforma LMS',
                'domain' => null,
                'plan' => 'platform',
                'is_active' => true,
            ]
        );

        $password = Hash::make('Password123!');

        $admin = $this->seedUser($tenant->id, 'admin@demo.com', 'admin', $password);
        $this->seedUser($tenant->id, 'instructor@demo.com', 'instructor', $password);
        $this->seedUser($tenant->id, 'student@demo.com', 'student', $password);

        UserProfile::query()
            ->withoutGlobalScope(TenantScope::class)
            ->updateOrCreate(
                ['tenant_id' => $tenant->id, 'user_id' => $admin->id],
                ['first_name' => 'Admin', 'last_name' => 'Demo', 'locale' => 'es']
            );

        $this->seedUser($platformTenant->id, 'owner@platform.com', 'platform', $password);

        $this->call(ProfessionSeeder::class);
        $this->call(NationalitySeeder::class);
        $this->call(ChurchDemoSeeder::class);
    }

    private function seedUser(string $tenantId, string $email, string $role, string $password): User
    {
        return User::query()
            ->withoutGlobalScope(TenantScope::class)
            ->firstOrCreate(
                ['tenant_id' => $tenantId, 'email' => $email],
                [
                    'password' => $password,
                    'role' => $role,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
    }
}
