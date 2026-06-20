import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  push: (type: ToastType, message: string, durationMs?: number) => string;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (type, message, durationMs) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    set((s) => ({
      toasts: [...s.toasts.slice(-4), { id, type, message }],
    }));
    const duration =
      durationMs ?? (type === "error" ? 6000 : type === "info" ? 5000 : 4000);
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(type: ToastType, message: string, durationMs?: number) {
  return useToastStore.getState().push(type, message, durationMs);
}
