"use client";

import { useI18n } from "@/i18n";
import { notifyInfo } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Field = { id: string; labelKey: string; placeholder?: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleKey: string;
  descKey: string;
  fields?: Field[];
};

export function PlaceholderCreateDialog({
  open,
  onOpenChange,
  titleKey,
  descKey,
  fields = [],
}: Props) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-brand-dark dark:text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(descKey)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.id} className="space-y-2">
              <Label htmlFor={f.id}>{t(f.labelKey)}</Label>
              <Input
                id={f.id}
                placeholder={f.placeholder}
                className="dark:bg-white/5 dark:border-white/10"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              notifyInfo(t("common.comingSoon"));
              onOpenChange(false);
            }}
          >
            {t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
