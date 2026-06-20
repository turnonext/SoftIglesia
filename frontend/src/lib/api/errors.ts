import axios, { type AxiosError } from "axios";

type ApiErrorBody = { message?: string; errors?: Record<string, string[]> };

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error == null) {
    return fallback;
  }

  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    const first = data?.errors && Object.values(data.errors)[0]?.[0];
    if (first) return first;
    if (error.message) return error.message;
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
