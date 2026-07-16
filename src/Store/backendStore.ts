import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { appStorage } from '@/Store/persistStorage'

export type Backend = 'local-csv' | 'google-drive'

/**
 * Which storage backend the user chose. The choice itself persists to
 * `localStorage` so returning users skip the setup wizard (ARCHITECTURE.md,
 * "Client-side persistence").
 *
 * The Local CSV directory handle lives here only in memory: the persisted
 * copy is in IndexedDB — the one store that can hold a
 * `FileSystemDirectoryHandle` — managed by
 * `src/Repository/LocalCsv/persistDirectoryHandle.ts`.
 */
interface BackendState {
  backend: Backend | null
  localDirectoryHandle: FileSystemDirectoryHandle | null
  setBackend(backend: Backend): void
  setLocalDirectoryHandle(handle: FileSystemDirectoryHandle | null): void
  clearBackend(): void
}

export const useBackendStore = create<BackendState>()(
  persist(
    (set) => ({
      backend: null,
      localDirectoryHandle: null,

      setBackend: (backend) => set({ backend }),

      setLocalDirectoryHandle: (handle) => set({ localDirectoryHandle: handle }),

      clearBackend: () => set({ backend: null, localDirectoryHandle: null }),
    }),
    {
      name: 'backend-storage',
      storage: createJSONStorage(appStorage),
      // The directory handle is not JSON-serializable — IndexedDB persists it.
      partialize: (state) => ({ backend: state.backend }),
    }
  )
)
