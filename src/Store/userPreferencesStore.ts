import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { detectBrowserLanguage } from '@/I18n'
import { appStorage } from '@/Store/persistStorage'

export type Language = 'en' | 'es'
export type Theme = 'light' | 'dark'

/**
 * Language and theme preferences, persisted to `localStorage`.
 *
 * The persist key and the persisted shape `{ state: { language, theme } }`
 * are load-bearing: `src/I18n/index.ts` (`readPersistedLanguage`) reads the
 * `user-preferences-storage` entry directly before React (and Zustand
 * hydration) start. Do not rename the key or restructure the partialized
 * state without updating that reader.
 */
interface UserPreferencesState {
  language: Language
  theme: Theme
  setLanguage(language: Language): void
  setTheme(theme: Theme): void
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      // First run speaks the browser's language; a persisted choice overrides.
      language: detectBrowserLanguage(),
      theme: 'light',

      setLanguage: (language) => set({ language }),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'user-preferences-storage',
      storage: createJSONStorage(appStorage),
      partialize: (state) => ({ language: state.language, theme: state.theme }),
    }
  )
)
