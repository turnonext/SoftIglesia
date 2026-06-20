<?php

namespace App\Modules\ChurchPeople\Http\Controllers;

use App\Modules\ChurchPeople\Http\Requests\StoreCatalogItemRequest;
use App\Modules\ChurchPeople\Models\Nationality;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class NationalityController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Nationality::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'sort_order']);

        return response()->json(['data' => $items]);
    }

    public function store(StoreCatalogItemRequest $request): JsonResponse
    {
        $maxOrder = (int) Nationality::query()->max('sort_order');

        $item = Nationality::query()->create([
            'name' => trim($request->validated('name')),
            'code' => $request->validated('code') ? strtoupper(trim($request->validated('code'))) : null,
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json(['data' => $item], 201);
    }

    public function destroy(Nationality $nationality): JsonResponse
    {
        $nationality->delete();

        return response()->json(['message' => 'Nacionalidad eliminada.']);
    }
}
