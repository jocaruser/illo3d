import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import en from '../../locales/en.json';

export type Locale = 'en' | 'es';

type Messages = Record<string, string>;

const messagesByLocale: Record<Locale, Messages> = { en, es: en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
    text
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const messages = messagesByLocale[locale];

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(value);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const text = messages[key] ?? key;
      return interpolate(text, params);
    },
    [messages]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
