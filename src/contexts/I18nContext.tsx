import { createContext, useContext, useState, ReactNode } from "react";
import { Locale, getTranslator, getFormatter, formatCurrency as formatCurrencyFn, FormatCurrencyOptions } from "@/i18n";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, options?: FormatCurrencyOptions) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("pl");
  const t = getTranslator(locale);
  const { formatDate, formatNumber } = getFormatter(locale);
  const formatCurrency = (value: number, options?: FormatCurrencyOptions) => formatCurrencyFn(value, locale, options);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatDate, formatNumber, formatCurrency }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
