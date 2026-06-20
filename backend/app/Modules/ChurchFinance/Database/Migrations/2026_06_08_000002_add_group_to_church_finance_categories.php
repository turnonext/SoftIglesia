<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('church_finance_categories', function (Blueprint $table) {
            $table->string('group', 32)->default('expense')->after('name');
            $table->dropUnique('cfin_cat_tenant_name_uq');
            $table->unique(['tenant_id', 'group', 'name'], 'cfin_cat_tenant_group_name_uq');
            $table->index(['tenant_id', 'group', 'is_active'], 'cfin_cat_tenant_group_active_idx');
        });
    }

    public function down(): void
    {
        Schema::table('church_finance_categories', function (Blueprint $table) {
            $table->dropIndex('cfin_cat_tenant_group_active_idx');
            $table->dropUnique('cfin_cat_tenant_group_name_uq');
            $table->unique(['tenant_id', 'name'], 'cfin_cat_tenant_name_uq');
            $table->dropColumn('group');
        });
    }
};
