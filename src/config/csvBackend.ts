import type { Backend } from '@/stores/backendStore'
import { useBackendStore } from '@/stores/backendStore'

export function getBackend(): Backend | null {
  return useBackendStore.getState().backend
}

/** True when backend is local-csv. Falls back to import.meta.env.DEV when backend not yet set (backward compat). */
export function isCsvBackendEnabled(): boolean {
  const backend = getBackend()
  if (backend === 'local-csv') return true
  if (backend === null) return !!import.meta.env.DEV
  return false
}

/** Only allow alphanumeric, hyphen, underscore. Prevents path traversal when building fixture URLs. */
export function sanitizeFixtureFolderId(folderId: string): string | null {
  return /^[a-zA-Z0-9_-]+$/.test(folderId) ? folderId : null
}

/** Injected fixture folder for Local CSV (dev only). Set via VITE_LOCAL_CSV_FIXTURE_FOLDER. */
export function getLocalCsvFixtureFolder(): string | null {
  const raw = import.meta.env.VITE_LOCAL_CSV_FIXTURE_FOLDER
  if (typeof raw !== 'string' || !raw.trim()) return null
  return sanitizeFixtureFolderId(raw.trim()) ?? null
}
