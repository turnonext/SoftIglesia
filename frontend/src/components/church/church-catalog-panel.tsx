"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { ChurchCatalogItem, ChurchCatalogResponse } from "@/lib/types/church-catalog";

type ChurchCatalogPanelProps = {
  endpoint: string;
  queryKey: string;
  title: string;
  placeholder: string;
  addLabel: string;
  emptyLabel: string;
  addedMessage: string;
  addOnlyHint?: string;
  showCodeField?: boolean;
  codePlaceholder?: string;
  canEdit?: boolean;
};

export function ChurchCatalogPanel({
  endpoint,
  queryKey,
  title,
  placeholder,
  addLabel,
  emptyLabel,
  addedMessage,
  addOnlyHint,
  showCodeField = false,
  codePlaceholder = "Código",
  canEdit = true,
}: ChurchCatalogPanelProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data } = await api.get<ChurchCatalogResponse>(endpoint);
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: { name: string; code?: string } = { name: name.trim() };
      if (showCodeField && code.trim()) payload.code = code.trim().toUpperCase();
      const { data } = await api.post<{ data: ChurchCatalogItem }>(endpoint, payload);
      return data.data;
    },
    onSuccess: () => {
      notifySuccess(addedMessage);
      setName("");
      setCode("");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["church-professions"] });
      queryClient.invalidateQueries({ queryKey: ["church-nationalities"] });
    },
    onError: (e) => notifyApiError(e),
  });

  const items = data ?? [];

  return (
    <Card className="p-4 sm:p-5">
      <h3 className="mb-4 text-base font-semibold">{title}</h3>

      {canEdit && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sm:max-w-xs"
          />
          {showCodeField && (
            <Input
              placeholder={codePlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-24 uppercase"
              maxLength={8}
            />
          )}
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="shrink-0"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {addLabel}
          </Button>
        </div>
      )}

      {addOnlyHint && canEdit && (
        <p className="mb-4 text-xs text-muted-foreground dark:text-[#A1A6AA]">{addOnlyHint}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground dark:text-[#A1A6AA]">{emptyLabel}</p>
      ) : (
        <ul className="max-h-80 divide-y divide-border/40 overflow-y-auto rounded-lg border border-border/60 dark:border-white/10">
          {items.map((item) => (
            <li
              key={item.id}
              className="px-3 py-2.5 text-sm hover:bg-muted/30 dark:hover:bg-white/5"
            >
              {item.name}
              {item.code && (
                <span className="ml-2 text-xs text-muted-foreground dark:text-[#A1A6AA]">
                  ({item.code})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground dark:text-[#A1A6AA]">
        {items.length} {title.toLowerCase()}
      </p>
    </Card>
  );
}
