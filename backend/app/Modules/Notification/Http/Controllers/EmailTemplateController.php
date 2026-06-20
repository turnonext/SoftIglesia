<?php

namespace App\Modules\Notification\Http\Controllers;

use App\Modules\Audit\Services\AccessLogService;
use App\Modules\Audit\Support\AccessLogAction;
use App\Modules\Notification\Http\Requests\PreviewEmailTemplateRequest;
use App\Modules\Notification\Http\Requests\UpdateEmailTemplateRequest;
use App\Modules\Notification\Services\EmailTemplateRepository;
use App\Modules\Notification\Services\TenantMailService;
use App\Modules\Notification\Support\EmailTemplateCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;

class EmailTemplateController extends Controller
{
    public function __construct(
        private readonly EmailTemplateRepository $repository,
        private readonly TenantMailService $mail,
        private readonly AccessLogService $accessLog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        if ($missing = $this->missingTemplatesTableResponse()) {
            return $missing;
        }

        $templates = $this->repository->listForTenant($request->user()->tenant_id);

        return response()->json([
            'data' => array_map(fn ($t) => $this->present($t), $templates),
        ]);
    }

    public function show(Request $request, string $key): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        if ($missing = $this->missingTemplatesTableResponse()) {
            return $missing;
        }

        $template = $this->repository->resolve($request->user()->tenant_id, $key);

        return response()->json(['data' => $this->present($template)]);
    }

    public function update(UpdateEmailTemplateRequest $request, string $key): JsonResponse
    {
        $template = $this->repository->resolve($request->user()->tenant_id, $key);
        $validated = $request->validated();
        $diff = [];
        foreach ($validated as $field => $value) {
            $previous = $template->{$field};
            if ($previous != $value) {
                $diff[$field] = ['from' => $previous, 'to' => $value];
            }
        }
        $template->update($validated);

        $this->accessLog->recordDomain(
            AccessLogAction::EMAIL_TEMPLATE_UPDATED,
            $request,
            [
                'entity' => 'email_template',
                'template_key' => $key,
                'fields' => array_keys($diff),
                'changes' => $diff,
            ],
        );

        return response()->json([
            'data' => $this->present($template->fresh()),
            'message' => 'Plantilla guardada.',
        ]);
    }

    public function preview(PreviewEmailTemplateRequest $request, string $key): JsonResponse
    {
        $template = $this->repository->resolve($request->user()->tenant_id, $key);

        $subject = $request->input('subject', $template->subject);
        $body = $request->input('body_html', $template->body_html);

        $previewTemplate = $template->replicate();
        $previewTemplate->subject = $subject;
        $previewTemplate->body_html = $body;

        $rendered = $this->mail->preview(
            $previewTemplate,
            $request->input('sample_variables', [])
        );

        return response()->json(['data' => $rendered]);
    }

    private function missingTemplatesTableResponse(): ?JsonResponse
    {
        if (Schema::hasTable('email_templates')) {
            return null;
        }

        return response()->json([
            'message' => 'Falta la tabla email_templates. Ejecutá: docker compose exec backend php artisan migrate --force',
            'hint' => 'run_migrations',
        ], 503);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(\App\Modules\Notification\Models\EmailTemplate $template): array
    {
        return [
            'id' => $template->id,
            'key' => $template->key,
            'name' => $template->name,
            'subject' => $template->subject,
            'body_html' => $template->body_html,
            'available_variables' => EmailTemplateCatalog::variablesFor($template->key),
            'is_active' => $template->is_active,
        ];
    }
}
