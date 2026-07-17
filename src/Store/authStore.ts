import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { appStorage } from '@/Store/persistStorage'

export interface AuthUser {
  email: string
  name: string
  picture?: string
}

export interface GoogleCredentials {
  accessToken: string
  accessTokenExpiresAtMs: number
}

/**
 * Authentication state. Who the user is persists across reloads and tabs;
 * the Google access token does NOT.
 *
 * Why the token is memory-only (see ARCHITECTURE.md, "Client-side
 * persistence"): a token in `localStorage` is readable by any XSS payload and
 * outlives the tab for no benefit — the Google Identity Services token client
 * renews silently (`src/Security/GoogleSession.ts`), so a reload simply
 * re-acquires a token. Persisting it would widen the XSS surface without
 * saving a single user interaction.
 */
interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  /** Memory only — never persisted (see the note above). */
  accessToken: string | null
  /** Memory only — absolute epoch ms at which the access token expires. */
  accessTokenExpiresAtMs: number | null
  /** Memory only — set when silent renewal fails and the user must sign in again. */
  googleSessionNeedsReauth: boolean
  login(user: AuthUser, credentials: GoogleCredentials): void
  loginAsLocalUser(): void
  patchGoogleCredentials(credentials: GoogleCredentials): void
  markGoogleSessionNeedsReauth(): void
  clearGoogleSessionNeedsReauth(): void
  logout(): void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      accessTokenExpiresAtMs: null,
      googleSessionNeedsReauth: false,

      login: (user, credentials) =>
        set({
          user,
          isAuthenticated: true,
          accessToken: credentials.accessToken,
          accessTokenExpiresAtMs: credentials.accessTokenExpiresAtMs,
          googleSessionNeedsReauth: false,
        }),

      /** Local CSV backend: a synthetic user with no Google credentials. */
      loginAsLocalUser: () =>
        set({
          user: { email: '', name: 'Local user' },
          isAuthenticated: true,
          accessToken: null,
          accessTokenExpiresAtMs: null,
          googleSessionNeedsReauth: false,
        }),

      /** Fresh credentials mean the Google session is healthy again. */
      patchGoogleCredentials: (credentials) =>
        set({
          accessToken: credentials.accessToken,
          accessTokenExpiresAtMs: credentials.accessTokenExpiresAtMs,
          googleSessionNeedsReauth: false,
        }),

      markGoogleSessionNeedsReauth: () => set({ googleSessionNeedsReauth: true }),

      clearGoogleSessionNeedsReauth: () => set({ googleSessionNeedsReauth: false }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          accessTokenExpiresAtMs: null,
          googleSessionNeedsReauth: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(appStorage),
      // Only the identity is persisted — tokens and reauth flags stay in memory.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
