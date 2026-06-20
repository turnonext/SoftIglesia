import { getApiErrorMessage } from "@/lib/api/errors";
import { toast, type ToastType } from "@/stores/toast-store";

export function notify(type: ToastType, message: string) {
  toast(type, message);
}

export function notifySuccess(message: string) {
  notify("success", message);
}

export function notifyError(message: string) {
  notify("error", message);
}

export function notifyInfo(message: string, durationMs?: number) {
  notify("info", message, durationMs);
}

/** Cambios guardados / datos actualizados */
export function notifyUpdated(message: string) {
  notify("success", message);
}

export function notifyApiError(error: unknown, fallback: string) {
  notifyError(getApiErrorMessage(error, fallback));
}
