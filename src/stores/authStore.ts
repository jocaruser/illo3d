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
}

interface AuthState {
  user: User | null
  credentials: Credentials | null
  isAuthenticated: boolean
  login: (user: User, credentials: Credentials) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      credentials: null,
      isAuthenticated: false,
      login: (user, credentials) =>
        set({
          user,
          credentials,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          credentials: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: appPersistJSONStorage(),
    }
  )
)
