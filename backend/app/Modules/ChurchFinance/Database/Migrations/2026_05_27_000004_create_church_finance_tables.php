<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('church_finance_categories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->string('name', 120);
            $table->string('type', 32); // tithes|offering|income|expense
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'type', 'is_active'], 'cfin_cat_tenant_type_idx');
            $table->unique(['tenant_id', 'name'], 'cfin_cat_tenant_name_uq');
        });

        Schema::create('church_finance_transactions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('tenant_id')->index();
            $table->ulid('campus_id')->nullable()->index();
            $table->ulid('category_id')->nullable()->index();
            $table->string('kind', 32); // tithes|offering|income|expense
            $table->decimal('amount', 14, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('reference', 80)->nullable();
            $table->string('donor_name', 160)->nullable();
            $table->string('description', 255)->nullable();
            $table->date('occurred_on');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'occurred_on'], 'cfin_tx_tenant_date_idx');
            $table->index(['tenant_id', 'kind', 'currency'], 'cfin_tx_tenant_kind_cur_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('church_finance_transactions');
        Schema::dropIfExists('church_finance_categories');
    }
};
