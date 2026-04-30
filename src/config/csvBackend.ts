import type { Backend } from '@/stores/backendStore'
import { useBackendStore } from '@/stores/backendStore'

export function getBackend(): Backend | null {
  return useBackendStore.getState().backend
}


