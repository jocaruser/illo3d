import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appPersistJSONStorage } from '@/stores/persistStorage'

export type Backend = 'local-csv' | 'google-drive'

interface BackendState {
  backend: Backend | null
  localDirectoryHandle: FileSystemDirectoryHandle | null
  setBackend: (backend: Backend | null) => void
  setLocalDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void
  clearBackend: () => void
  /** Same as `clearBackend` (wizard cancel / reset naming in specs). */
  reset: () => void
}

const clearBackendState = (): Pick<BackendState, 'backend' | 'localDirectoryHandle'> => ({
  backend: null,
  localDirectoryHandle: null,
})

export const useBackendStore = create<BackendState>()(
  persist(
    (set) => ({
      backend: null,
      localDirectoryHandle: null,
      setBackend: (backend) => set({ backend }),
      setLocalDirectoryHandle: (localDirectoryHandle) => set({ localDirectoryHandle }),
      clearBackend: () => set(clearBackendState()),
      reset: () => set(clearBackendState()),
    }),
    {
      name: 'backend-storage',
      storage: appPersistJSONStorage(),
      partialize: (state) => ({ backend: state.backend }),
    },
  ),
)
