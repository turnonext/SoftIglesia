<?php

namespace App\Modules\Notification\Services;

use App\Modules\Auth\Models\User;
use App\Modules\Notification\Mail\BrandedMailMessage;
use App\Modules\Notification\Models\EmailTemplate;
use App\Modules\Notification\Support\EmailTemplateCatalog;
use App\Modules\Shared\Models\Tenant;
use App\Modules\User\Models\UserProfile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class TenantMailService
{
    public function __construct(
        private readonly EmailTemplateRepository $templates,
        private readonly EmailTemplateRenderer $renderer,
        private readonly EmailBodyCompiler $compiler,
    ) {}

    /**
     * @param  array<string, string>  $extraVariables
     */
    public function sendTemplate(string $tenantId, string $key, string $toEmail, array $extraVariables = []): bool
    {
        if (! Schema::hasTable('email_templates')) {
            Log::warning('email_templates table missing; skip mail', ['key' => $key, 'to' => $toEmail]);

            return false;
        }

        $template = $this->templates->resolve($tenantId, $key);

        if (! $template->is_active) {
            return false;
        }

        $tenant = Tenant::query()->find($tenantId);
        $variables = array_merge($this->defaultVariables($tenantId), $extraVariables);
        $subject = $this->renderer->render($template->subject, $variables);
        $compiled = $this->compiler->compile($template->body_html, $tenant);
        $body = $this->renderer->render($compiled['html'], $variables);
        $preview = Str::limit(strip_tags($body), 120);

        try {
            Mail::to($toEmail)->send(new BrandedMailMessage($subject, $body, $preview, $compiled['theme']));
            $this->logSent($tenantId, $toEmail, $key, $subject, $body);

            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to send template mail', [
                'key' => $key,
                'to' => $toEmail,
                'error' => $e->getMessage(),
            ]);
            $this->logFailed($tenantId, $toEmail, $key, $subject, $body, $e->getMessage());

            return false;
        }
    }

    public function sendPromotedToInstructor(User $user, ?UserProfile $profile, string $tenantId): bool
    {
        $first = $profile?->first_name ?? '';
        $last = $profile?->last_name ?? '';
        $name = trim("{$first} {$last}") ?: $user->email;

        return $this->sendTemplate($tenantId, EmailTemplateCatalog::KEY_USER_PROMOTED_INSTRUCTOR, $user->email, [
            'user_name' => $name,
            'user_email' => $user->email,
        ]);
    }

    /**
     * @param  array<string, string>  $sampleVariables
     * @return array{subject: string, body_html: string, theme: array<string, string>}
     */
    public function preview(EmailTemplate $template, array $sampleVariables = []): array
    {
        $variables = array_merge($this->defaultVariables($template->tenant_id), $sampleVariables);
        $tenant = Tenant::query()->find($template->tenant_id);

        $compiled = $this->compiler->compile($template->body_html, $tenant);

        return [
            'subject' => $this->renderer->render($template->subject, $variables),
            'body_html' => $this->renderer->render($compiled['html'], $variables),
            'theme' => $compiled['theme'],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function defaultVariables(string $tenantId): array
    {
        $tenant = Tenant::query()->find($tenantId);
        $slug = $tenant?->slug ?? 'demo';
        $frontend = config('lms.frontend_url');

        return [
            'tenant_name' => $tenant?->name ?? 'Tu cliente',
            'app_name' => config('lms.app_name'),
            'login_url' => "{$frontend}/login?tenant={$slug}",
        ];
    }

    private function logSent(string $tenantId, string $to, string $key, string $subject, string $body): void
    {
        if (! Schema::hasTable('email_queue')) {
            return;
        }

        \DB::table('email_queue')->insert([
            'id' => (string) Str::ulid(),
            'tenant_id' => $tenantId,
            'to_email' => $to,
            'subject' => $subject,
            'body_html' => $body,
            'template' => $key,
            'status' => 'sent',
            'sent_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function logFailed(string $tenantId, string $to, string $key, string $subject, string $body, string $error): void
    {
        if (! Schema::hasTable('email_queue')) {
            return;
        }

        \DB::table('email_queue')->insert([
            'id' => (string) Str::ulid(),
            'tenant_id' => $tenantId,
            'to_email' => $to,
            'subject' => $subject,
            'body_html' => $body,
            'template' => $key,
            'status' => 'failed',
            'last_error' => $error,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
