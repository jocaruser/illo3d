import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appPersistJSONStorage } from '@/stores/persistStorage'

export interface User {
  email: string
  name: string
  picture?: string
}

export interface Credentials {
  accessToken: string
  /** Absolute time (ms since epoch) when the Google access token expires, if known. */
  accessTokenExpiresAtMs?: number
}

interface AuthState {
  user: User | null
  credentials: Credentials | null
  isAuthenticated: boolean
  /** True when silent Google token renewal failed; user should re-authenticate. Not persisted. */
  googleSessionNeedsReauth: boolean
  login: (user: User, credentials: Credentials) => void
  loginAsLocalUser: () => void
  logout: () => void
  patchGoogleCredentials: (partial: Pick<Credentials, 'accessToken' | 'accessTokenExpiresAtMs'>) => void
  markGoogleSessionNeedsReauth: () => void
  clearGoogleSessionNeedsReauth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      credentials: null,
      isAuthenticated: false,
      googleSessionNeedsReauth: false,
      login: (user, credentials) =>
        set({
          user,
          credentials,
          isAuthenticated: true,
          googleSessionNeedsReauth: false,
        }),
      loginAsLocalUser: () =>
        set({
          user: { name: 'Local user', email: '', picture: undefined },
          credentials: null,
          isAuthenticated: true,
          googleSessionNeedsReauth: false,
        }),
      logout: () =>
        set({
          user: null,
          credentials: null,
          isAuthenticated: false,
          googleSessionNeedsReauth: false,
        }),
      patchGoogleCredentials: (partial) =>
        set((s) => ({
          credentials: s.credentials ? { ...s.credentials, ...partial } : null,
        })),
      markGoogleSessionNeedsReauth: () => set({ googleSessionNeedsReauth: true }),
      clearGoogleSessionNeedsReauth: () => set({ googleSessionNeedsReauth: false }),
    }),
    {
      name: 'auth-storage',
      storage: appPersistJSONStorage(),
      partialize: (state) => ({
        user: state.user,
        credentials: state.credentials,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
