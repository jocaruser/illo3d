import { create } from 'zustand'

export type Backend = 'local-csv' | 'google-drive'

interface BackendState {
  backend: Backend | null
  localDirectoryHandle: FileSystemDirectoryHandle | null
  setBackend: (backend: Backend | null) => void
  setLocalDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void
  clearBackend: () => void
}

export const useBackendStore = create<BackendState>((set) => ({
  backend: null,
  localDirectoryHandle: null,
  setBackend: (backend) => set({ backend }),
  setLocalDirectoryHandle: (localDirectoryHandle) => set({ localDirectoryHandle }),
  clearBackend: () =>
    set({ backend: null, localDirectoryHandle: null }),
}))
