<?php

namespace App\Modules\Certificate\Http\Controllers;

use App\Modules\Certificate\Services\CertificateSignatureRepository;
use App\Modules\Certificate\Support\CertificateSignatures;
use App\Modules\Shared\Support\PreferredStorageDisk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class CertificateSignatureController extends Controller
{
    public function __construct(
        private readonly CertificateSignatureRepository $signatures,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeRoles($request);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        return response()->json([
            'data' => $this->presentList($request->user()->tenant_id),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->authorizeRoles($request);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        $validated = $request->validate(CertificateSignatures::validationRules());
        $this->signatures->updateFromInput(
            $request->user()->tenant_id,
            $validated['signatures'] ?? [],
        );

        return response()->json([
            'data' => $this->presentList($request->user()->tenant_id),
            'message' => 'Firmas guardadas.',
        ]);
    }

    public function uploadImage(Request $request, int $slot): JsonResponse
    {
        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        abort_unless($slot >= 1 && $slot <= CertificateSignatures::MAX_SLOTS, 404);

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);

        $tenantId = $request->user()->tenant_id;
        $row = $this->signatures->findSlot($tenantId, $slot);
        $disk = PreferredStorageDisk::resolve();
        $directory = "certificates/signatures/{$tenantId}";
        $extension = $request->file('image')->getClientOriginalExtension() ?: 'png';

        if ($row->image_path && Storage::disk($disk)->exists($row->image_path)) {
            Storage::disk($disk)->delete($row->image_path);
        }

        $stored = $request->file('image')->storeAs($directory, "signature-{$slot}.{$extension}", $disk);
        $row->update(['image_path' => $stored]);

        return response()->json([
            'data' => $this->presentList($tenantId),
            'message' => 'Imagen de firma actualizada.',
        ]);
    }

    public function removeImage(Request $request, int $slot): JsonResponse
    {
        $this->authorizeRoles($request);

        if ($missing = $this->missingTableResponse()) {
            return $missing;
        }

        abort_unless($slot >= 1 && $slot <= CertificateSignatures::MAX_SLOTS, 404);

        $tenantId = $request->user()->tenant_id;
        $row = $this->signatures->findSlot($tenantId, $slot);
        $disk = PreferredStorageDisk::resolve();

        if ($row->image_path && Storage::disk($disk)->exists($row->image_path)) {
            Storage::disk($disk)->delete($row->image_path);
        }

        $row->update(['image_path' => null]);

        return response()->json([
            'data' => $this->presentList($tenantId),
            'message' => 'Imagen de firma eliminada.',
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function presentList(string $tenantId): array
    {
        return array_map(
            fn ($row) => [
                'slot' => $row->slot,
                'enabled' => $row->enabled,
                'name' => $row->name,
                'title' => $row->title,
                'has_image' => ! empty($row->image_path),
            ],
            $this->signatures->ensureSlots($tenantId)
        );
    }

    private function authorizeRoles(Request $request): void
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);
    }

    private function missingTableResponse(): ?JsonResponse
    {
        if (Schema::hasTable('certificate_signatures')) {
            return null;
        }

        return response()->json([
            'message' => 'Ejecuta migraciones: certificate_signatures.',
        ], 503);
    }
}
