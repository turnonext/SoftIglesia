"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  className?: string;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
};

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Sin resultados",
  pageSize = 10,
  className,
  onRowClick,
  getRowId,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#1c1c22]/50 px-6 py-16 text-center text-sm text-[#A1A6AA] dark:bg-brand-dark/40">
        {emptyMessage}
      </div>
    );
  }

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm dark:border-white/10 dark:bg-[#1c1c22]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border/60 dark:border-white/10"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-[#A1A6AA]"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-2 transition-colors",
                          header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground dark:hover:text-white"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && (
                          <span className="text-brand-primary">↑</span>
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <span className="text-brand-primary">↓</span>
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/40 transition-colors last:border-0 hover:bg-muted/30 dark:border-white/5 dark:hover:bg-white/[0.03]",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row.original)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick(row.original);
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3.5 align-middle text-foreground dark:text-white/90">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 dark:border-white/10">
          <p className="text-xs text-muted-foreground dark:text-[#A1A6AA]">
            {pageIndex + 1} / {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
