<?php

namespace App\Modules\Certificate\Http\Controllers;

use App\Modules\Certificate\Http\Requests\StoreCertificateTemplateRequest;
use App\Modules\Certificate\Http\Requests\UpdateCertificateTemplateRequest;
use App\Modules\Certificate\Http\Requests\UploadCertificateTemplateRequest;
use App\Modules\Certificate\Models\CertificateTemplate;
use App\Modules\Certificate\Services\CertificateSignatureRepository;
use App\Modules\Certificate\Services\CertificateSignatureRenderer;
use App\Modules\Certificate\Services\CertificateTemplateRenderer;
use App\Modules\Certificate\Services\CertificateTemplateRepository;
use App\Modules\Certificate\Support\CertificateHtmlSanitizer;
use App\Modules\Certificate\Support\CertificateTemplateCatalog;
use App\Modules\Shared\Models\Tenant;
use App\Modules\Shared\Support\PreferredStorageDisk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class CertificateTemplateController extends Controller
{
    public function __construct(
        private readonly CertificateTemplateRepository $templates,
        private readonly CertificateSignatureRepository $signatures,
        private readonly CertificateTemplateRenderer $renderer,
        private readonly CertificateSignatureRenderer $signatureRenderer,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeRoles($request);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $tenantId = $request->user()->tenant_id;
        $items = $this->templates->listForTenant($tenantId);

        return response()->json([
            'data' => array_map(fn (CertificateTemplate $t) => $this->present($t), $items),
            'variables' => CertificateTemplateCatalog::variables(),
            'system_keys' => [
                CertificateTemplateCatalog::KEY_CLASSIC,
                CertificateTemplateCatalog::KEY_MODERN,
            ],
        ]);
    }

    public function store(StoreCertificateTemplateRequest $request): JsonResponse
    {
        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $tenantId = $request->user()->tenant_id;
        $validated = $request->validated();

        $body = isset($validated['body_html'])
            ? CertificateHtmlSanitizer::sanitize($validated['body_html'])
            : CertificateHtmlSanitizer::blankScaffold();

        if (! empty($validated['from_system_key'])) {
            $source = $this->templates->resolveSystem($tenantId, $validated['from_system_key']);
            $body = $source->body_html;
        }

        $template = $this->templates->createCustom(
            $tenantId,
            $validated['name'],
            $body,
            $validated['key'] ?? null,
        );

        return response()->json([
            'data' => $this->present($template),
            'message' => 'Plantilla creada.',
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $this->authorizeRoles($request);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $template = $this->templates->findForTenant($request->user()->tenant_id, $id);

        return response()->json(['data' => $this->present($template)]);
    }

    public function update(UpdateCertificateTemplateRequest $request, string $id): JsonResponse
    {
        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $template = $this->templates->findForTenant($request->user()->tenant_id, $id);
        $template->update($request->validated());

        return response()->json([
            'data' => $this->present($template->fresh()),
            'message' => 'Plantilla guardada.',
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->authorizeRoles($request);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $template = $this->templates->findForTenant($request->user()->tenant_id, $id);
        abort_if($template->is_system, 403, 'Las plantillas del sistema no se pueden eliminar.');

        $template->delete();

        return response()->json(['message' => 'Plantilla eliminada.']);
    }

    public function upload(UploadCertificateTemplateRequest $request, string $id): JsonResponse
    {
        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $template = $this->templates->findForTenant($request->user()->tenant_id, $id);
        $raw = file_get_contents($request->file('file')->getRealPath());
        $body = CertificateHtmlSanitizer::sanitize($raw ?: '');

        abort_if($body === '', 422, 'El archivo HTML está vacío o no es válido.');

        $template->update(['body_html' => $body]);

        return response()->json([
            'data' => $this->present($template->fresh()),
            'message' => 'HTML cargado correctamente.',
        ]);
    }

    public function preview(Request $request, string $id): JsonResponse
    {
        $this->authorizeRoles($request);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $request->validate([
            'body_html' => ['sometimes', 'nullable', 'string', 'max:500000'],
        ]);

        $tenantId = $request->user()->tenant_id;
        $template = $this->templates->findForTenant($tenantId, $id);
        $bodyInput = $request->input('body_html');
        $bodyHtml = is_string($bodyInput) && trim($bodyInput) !== ''
            ? CertificateHtmlSanitizer::sanitize($bodyInput)
            : $template->body_html;

        $html = $this->renderHtml($tenantId, $bodyHtml, $this->sampleVariables($request));

        return response()->json(['html' => $html]);
    }

    public function downloadDemo(Request $request): Response
    {
        $this->authorizeRoles($request);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $tenantId = $request->user()->tenant_id;
        $template = $this->templates->resolveSystem($tenantId, CertificateTemplateCatalog::KEY_CLASSIC);
        $html = $this->renderTemplateHtml($tenantId, $template, $this->sampleVariables($request));

        return $this->htmlDownload($html, 'certificado-demo.html');
    }

    public function downloadSystem(Request $request, string $key): Response
    {
        $this->authorizeRoles($request);

        abort_unless(in_array($key, [CertificateTemplateCatalog::KEY_CLASSIC, CertificateTemplateCatalog::KEY_MODERN], true), 404);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $definition = CertificateTemplateCatalog::systemDefinitions()[$key];
        $filename = "plantilla-{$key}.html";

        return $this->htmlDownload($definition['body_html'], $filename);
    }

    private function htmlDownload(string $html, string $filename): Response
    {
        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * @param  array<string, string>  $variables
     */
    private function renderTemplateHtml(string $tenantId, CertificateTemplate $template, array $variables): string
    {
        return $this->renderHtml($tenantId, $template->body_html, $variables);
    }

    /**
     * @param  array<string, string>  $variables
     */
    private function renderHtml(string $tenantId, string $bodyHtml, array $variables): string
    {
        $signatures = $this->signatures->normalizedForTenant($tenantId);
        $disk = PreferredStorageDisk::resolve();
        $merged = array_merge($variables, $this->signatureRenderer->variables($signatures, $disk));

        return $this->renderer->render($bodyHtml, $merged);
    }

    /**
     * Datos de ejemplo del curso/estudiante; las firmas vienen siempre del tenant.
     *
     * @return array<string, string>
     */
    private function sampleVariables(Request $request): array
    {
        $tenant = Tenant::query()->find($request->user()->tenant_id);
        $vars = CertificateTemplateCatalog::demoVariables();
        $vars['tenant_name'] = $tenant?->name ?? $vars['tenant_name'];

        foreach (array_keys($vars) as $key) {
            if ($key === 'signatures_section' || str_starts_with($key, 'signature_')) {
                unset($vars[$key]);
            }
        }

        return $vars;
    }

    /**
     * @return array<string, mixed>
     */
    private function present(CertificateTemplate $template): array
    {
        return [
            'id' => $template->id,
            'key' => $template->key,
            'name' => $template->name,
            'body_html' => $template->body_html,
            'available_variables' => $template->available_variables,
            'is_system' => $template->is_system,
            'is_active' => $template->is_active,
            'updated_at' => $template->updated_at?->toAtomString(),
        ];
    }

    private function authorizeRoles(Request $request): void
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);
    }

    private function missingTableResponse(): ?JsonResponse
    {
        if (Schema::hasTable('certificate_templates')) {
            return null;
        }

        return response()->json([
            'message' => 'Ejecuta migraciones: certificate_templates.',
        ], 503);
    }
}
