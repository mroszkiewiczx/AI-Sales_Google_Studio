import pl from "./pl";
import en from "./en";

export type Locale = "pl" | "en";
export type CurrencyCode = "PLN" | "USD";

type DeepKeys<T, Prefix extends string = ""> = T extends Record<string, unknown>
  ? { [K in keyof T & string]: DeepKeys<T[K], `${Prefix}${Prefix extends "" ? "" : "."}${K}`> }[keyof T & string]
  : Prefix;

const translations = { pl, en } as const;

export function getTranslator(locale: Locale) {
  return function t(key: string, params?: Record<string, any>): string {
    const keys = key.split(".");
    let obj: Record<string, unknown> = translations[locale] as any;
    for (const k of keys) {
      if (obj == null) return key;
      obj = (obj as any)[k];
    }
    if (typeof obj !== "string") return key;
    
    let result = obj as string;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v));
      });
    }
    return result;
  };
}

export interface FormatCurrencyOptions {
  currency?: CurrencyCode;
  workspaceCurrency?: string;
  decimals?: number;
}

export function formatCurrency(value: number, locale: Locale, options?: FormatCurrencyOptions): string {
  const currency = options?.currency || (options?.workspaceCurrency as CurrencyCode) || "PLN";
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 0,
  }).format(value);
}

export function getFormatter(locale: Locale) {
  return {
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", options).format(
        typeof date === "string" ? new Date(date) : date
      );
    },
    formatNumber: (value: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", options).format(value);
    },
  };
}
