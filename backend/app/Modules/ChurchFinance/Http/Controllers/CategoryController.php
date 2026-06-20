<?php

namespace App\Modules\ChurchFinance\Http\Controllers;

use App\Modules\ChurchFinance\Models\FinanceCategory;
use App\Modules\ChurchFinance\Services\FinanceCategorySeeder;
use App\Modules\ChurchFinance\Support\FinanceCategoryCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CategoryController extends Controller
{
    public function index(Request $request, FinanceCategorySeeder $seeder): JsonResponse
    {
        $seeder->seedDefaults();

        $group = $request->query('group');
        $type = $request->query('type');

        $items = FinanceCategory::query()
            ->when(FinanceCategoryCatalog::isValidGroup((string) $group), fn ($q) => $q->where('group', $group))
            ->when(in_array($type, ['tithes', 'offering', 'income', 'expense'], true), fn ($q) => $q->where('type', $type))
            ->orderByRaw("CASE `group` WHEN 'income' THEN 1 WHEN 'expense' THEN 2 WHEN 'assets' THEN 3 WHEN 'cash_banks' THEN 4 WHEN 'transfers' THEN 5 ELSE 6 END")
            ->orderBy('name')
            ->get(['id', 'group', 'name', 'type', 'is_system', 'is_active']);

        $grouped = [];
        foreach (FinanceCategoryCatalog::GROUPS as $groupKey) {
            $grouped[$groupKey] = $items->where('group', $groupKey)->values()->all();
        }

        return response()->json([
            'data' => $items,
            'groups' => $grouped,
            'catalog' => FinanceCategoryCatalog::GROUPS,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'instructor'], true), 403);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'group' => ['required', 'in:income,expense,assets,cash_banks,transfers'],
            'type' => ['nullable', 'in:expense,income,tithes,offering'],
        ]);

        $group = $payload['group'];
        $name = trim($payload['name']);
        $type = $payload['type'] ?? FinanceCategoryCatalog::defaultTypeForGroup($group);

        $exists = FinanceCategory::query()
            ->where('group', $group)
            ->where('name', $name)
            ->exists();

        abort_if($exists, 422, 'Ya existe una categoría con ese nombre en el grupo.');

        $item = FinanceCategory::query()->create([
            'group' => $group,
            'name' => $name,
            'type' => $type,
            'is_system' => false,
            'is_active' => true,
        ]);

        return response()->json([
            'data' => $item,
            'message' => 'Categoría creada.',
        ], 201);
    }

    public function update(Request $request, FinanceCategory $financeCategory): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);
        abort_if($financeCategory->is_system, 403, 'No se puede modificar una categoría del sistema.');

        $payload = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'group' => ['sometimes', 'in:income,expense,assets,cash_banks,transfers'],
            'type' => ['sometimes', 'in:expense,income,tithes,offering'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($payload['name']) || isset($payload['group'])) {
            $name = trim($payload['name'] ?? $financeCategory->name);
            $group = $payload['group'] ?? $financeCategory->group;
            $exists = FinanceCategory::query()
                ->where('group', $group)
                ->where('name', $name)
                ->where('id', '!=', $financeCategory->id)
                ->exists();
            abort_if($exists, 422, 'Ya existe una categoría con ese nombre en el grupo.');
            $payload['name'] = $name;
        }

        $financeCategory->fill($payload)->save();

        return response()->json([
            'data' => $financeCategory->fresh(),
            'message' => 'Categoría actualizada.',
        ]);
    }

    public function destroy(FinanceCategory $financeCategory): JsonResponse
    {
        abort_unless(request()->user()?->role === 'admin', 403);
        abort_if($financeCategory->is_system, 403, 'No se puede eliminar una categoría del sistema.');

        $inUse = $financeCategory->transactions()->exists()
            || $financeCategory->fixedExpenses()->exists();

        if ($inUse) {
            $financeCategory->update(['is_active' => false]);

            return response()->json(['message' => 'Categoría desactivada porque tiene movimientos asociados.']);
        }

        $financeCategory->delete();

        return response()->json(['message' => 'Categoría eliminada.']);
    }
}
