<?php

namespace App\Modules\ChurchPeople\Http\Controllers;

use App\Modules\ChurchPeople\Http\Requests\StoreCatalogItemRequest;
use App\Modules\ChurchPeople\Models\Profession;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class ProfessionController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Profession::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'sort_order']);

        return response()->json(['data' => $items]);
    }

    public function store(StoreCatalogItemRequest $request): JsonResponse
    {
        $maxOrder = (int) Profession::query()->max('sort_order');

        $item = Profession::query()->create([
            'name' => trim($request->validated('name')),
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json(['data' => $item], 201);
    }

    public function destroy(Profession $profession): JsonResponse
    {
        $profession->delete();

        return response()->json(['message' => 'Profesión eliminada.']);
    }
}
