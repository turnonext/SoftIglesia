import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export const publicApi = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

export type PublicRegistrationQuery = {
  tenant: string;
  token: string;
};

export function registrationQueryString({ tenant, token }: PublicRegistrationQuery): string {
  return `tenant=${encodeURIComponent(tenant)}&token=${encodeURIComponent(token)}`;
}
