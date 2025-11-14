export type Settings = {
  appName?: string;
  appLogo?: string;
  appIcon?: string;
  defaultCurrency?: string;
  defaultLanguage?: string;
  availableLanguages?: string[];
  availableCurrencies?: string[];
  [key: string]: unknown;
};
