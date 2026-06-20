<?php

namespace App\Modules\File\Http\Controllers;

use App\Modules\File\Models\ContentFileLink;
use App\Modules\File\Models\File;
use App\Modules\Shared\Support\PreferredStorageDisk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ContentFileLink::query()
            ->with('file')
            ->where('tenant_id', $request->user()->tenant_id);

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }
        if ($request->filled('course_subject_id')) {
            $query->where('course_subject_id', $request->query('course_subject_id'));
        }
        if ($request->filled('class_id')) {
            $query->where('class_id', $request->query('class_id'));
        }

        return response()->json(['data' => $query->latest()->limit(50)->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpeg,jpg,png,webp,doc,docx,ppt,pptx'],
            'course_id' => ['nullable', 'ulid'],
            'course_subject_id' => ['nullable', 'ulid'],
            'class_id' => ['nullable', 'ulid'],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $tenantId = app('current.tenant_id') ?? $user->tenant_id;
        $uploaded = $request->file('file');
        $disk = $this->preferredDisk();
        $path = $uploaded->store("content/{$tenantId}/".date('Y/m'), $disk);

        $file = File::query()->create([
            'tenant_id' => $tenantId,
            'uploaded_by_user_id' => $user->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $uploaded->getClientOriginalName(),
            'mime_type' => $uploaded->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $uploaded->getSize(),
            'visibility' => 'private',
        ]);

        $link = null;
        if ($data['course_id'] ?? $data['course_subject_id'] ?? $data['class_id'] ?? null) {
            $link = ContentFileLink::query()->create([
                'tenant_id' => $tenantId,
                'file_id' => $file->id,
                'course_id' => $data['course_id'] ?? null,
                'course_subject_id' => $data['course_subject_id'] ?? null,
                'class_id' => $data['class_id'] ?? null,
                'label' => $data['label'] ?? $uploaded->getClientOriginalName(),
            ]);
            $link->load('file');
        }

        return response()->json([
            'data' => [
                'file_id' => $file->id,
                'file' => $file,
                'link' => $link,
            ],
        ], 201);
    }

    public function download(File $file): mixed
    {
        abort_unless($file->tenant_id === request()->user()->tenant_id, 403);

        if (! Storage::disk($file->disk)->exists($file->path)) {
            abort(404);
        }

        return Storage::disk($file->disk)->response(
            $file->path,
            $file->original_name,
            ['Content-Type' => $file->mime_type]
        );
    }

    private function preferredDisk(): string
    {
        return PreferredStorageDisk::resolve();
    }
}
