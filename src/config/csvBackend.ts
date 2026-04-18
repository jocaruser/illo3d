import type { Backend } from '@/stores/backendStore'
import { useBackendStore } from '@/stores/backendStore'

export function getBackend(): Backend | null {
  return useBackendStore.getState().backend
}

/**
 * True when local CSV fixture mode is active (no directory handle).
 * Used only for tests that wire `backend: 'local-csv'` without a File System Access handle.
 */
export function isCsvBackendEnabled(): boolean {
  const backend = getBackend()
  const handle = useBackendStore.getState().localDirectoryHandle
  return backend === 'local-csv' && !handle
}

/** Only allow alphanumeric, hyphen, underscore. Prevents path traversal when building fixture URLs. */
export function sanitizeFixtureFolderId(folderId: string): string | null {
  return /^[a-zA-Z0-9_-]+$/.test(folderId) ? folderId : null
}
