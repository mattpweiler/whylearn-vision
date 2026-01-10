import { CurrencyCode } from "@/lib/types";

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "MXN", label: "Mexican Peso (MXN)" },
];

export const isSupportedCurrency = (value?: string | null): value is CurrencyCode =>
  Boolean(value && CURRENCY_OPTIONS.some((option) => option.value === value));

export const normalizeCurrencyCode = (
  value?: string | null,
  fallback: CurrencyCode = DEFAULT_CURRENCY
): CurrencyCode => {
  if (isSupportedCurrency(value)) return value;
  return fallback;
};
