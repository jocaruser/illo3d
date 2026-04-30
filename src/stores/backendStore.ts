import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appPersistJSONStorage } from '@/stores/persistStorage'
import {
  saveLocalDirectoryHandle,
  clearLocalDirectoryHandle,
} from '@/services/local/persistDirectoryHandle'

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
      setLocalDirectoryHandle: (localDirectoryHandle) => {
        void saveLocalDirectoryHandle(localDirectoryHandle)
        set({ localDirectoryHandle })
      },
      clearBackend: () => {
        void clearLocalDirectoryHandle()
        set(clearBackendState())
      },
      reset: () => {
        void clearLocalDirectoryHandle()
        set(clearBackendState())
      },
    }),
    {
      name: 'backend-storage',
      storage: appPersistJSONStorage(),
      partialize: (state) => ({ backend: state.backend }),
    },
  ),
)
