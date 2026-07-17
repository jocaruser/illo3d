import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../translations/en.json'
import es from '../../translations/es.json'

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Reads the persisted language without importing the preferences store —
 * i18n must initialize before React (and before Zustand hydration).
 */
export function readPersistedLanguage(
  storage: Pick<Storage, 'getItem'>
): Language {
  try {
    const raw = storage.getItem('user-preferences-storage')
    if (raw === null) return 'en'
    const parsed = JSON.parse(raw) as { state?: { language?: string } }
    return parsed.state?.language === 'es' ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

export function initI18n(language: Language): typeof i18n {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  return i18n
}
