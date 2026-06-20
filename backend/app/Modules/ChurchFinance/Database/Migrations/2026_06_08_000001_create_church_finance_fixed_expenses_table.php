<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('church_finance_fixed_expenses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('category_id')->nullable()->index();
            $table->string('name', 120);
            $table->decimal('amount', 14, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('frequency', 16)->default('monthly'); // monthly|weekly|yearly
            $table->unsignedTinyInteger('due_day')->nullable(); // 1-31 for monthly
            $table->string('description', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active'], 'cfin_fix_tenant_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('church_finance_fixed_expenses');
    }
};
