export const DEFAULT_FINANCE_CURRENCY = "ARS";

/** ARS + las 10 monedas más usadas globalmente */
export const SUPPORTED_FINANCE_CURRENCIES = [
  { code: "ARS", labelKey: "churchFinance.currencyARS" },
  { code: "USD", labelKey: "churchFinance.currencyUSD" },
  { code: "EUR", labelKey: "churchFinance.currencyEUR" },
  { code: "GBP", labelKey: "churchFinance.currencyGBP" },
  { code: "BRL", labelKey: "churchFinance.currencyBRL" },
  { code: "MXN", labelKey: "churchFinance.currencyMXN" },
  { code: "CLP", labelKey: "churchFinance.currencyCLP" },
  { code: "COP", labelKey: "churchFinance.currencyCOP" },
  { code: "JPY", labelKey: "churchFinance.currencyJPY" },
  { code: "CNY", labelKey: "churchFinance.currencyCNY" },
  { code: "CHF", labelKey: "churchFinance.currencyCHF" },
] as const;

export type SupportedFinanceCurrency =
  (typeof SUPPORTED_FINANCE_CURRENCIES)[number]["code"];

export function isSupportedFinanceCurrency(code: string): code is SupportedFinanceCurrency {
  return SUPPORTED_FINANCE_CURRENCIES.some((c) => c.code === code.toUpperCase());
}

export function normalizeFinanceCurrency(code?: string): SupportedFinanceCurrency {
  const upper = (code ?? DEFAULT_FINANCE_CURRENCY).toUpperCase();
  return isSupportedFinanceCurrency(upper) ? upper : DEFAULT_FINANCE_CURRENCY;
}

export function formatFinanceMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-AR", {
      style: "currency",
      currency: normalizeFinanceCurrency(currency),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatFinanceDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
