import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appPersistJSONStorage } from '@/stores/persistStorage'

type Language = 'en' | 'es'
type Theme = 'light' | 'dark'

interface UserPreferencesState {
  language: Language
  theme: Theme
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'light',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'user-preferences-storage',
      storage: appPersistJSONStorage(),
    }
  )
)

export type { Language, Theme }
