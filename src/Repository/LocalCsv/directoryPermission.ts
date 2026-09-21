export type DirectoryPermissionState = 'granted' | 'prompt' | 'denied'

type PermissionHandle = FileSystemDirectoryHandle & {
  queryPermission?(options: {
    mode: 'read' | 'readwrite'
  }): Promise<PermissionState>
  requestPermission?(options: {
    mode: 'read' | 'readwrite'
  }): Promise<PermissionState>
}

function normalizeState(state: PermissionState): DirectoryPermissionState {
  if (state === 'granted') return 'granted'
  if (state === 'denied') return 'denied'
  return 'prompt'
}

/** Probe folder access without a user gesture. */
function e2eInjectedPermission(): DirectoryPermissionState | null {
  if (import.meta.env.VITE_E2E !== 'true') return null
  const state = (window as unknown as { __e2eDirectoryPermission?: string })
    .__e2eDirectoryPermission
  if (state === 'granted' || state === 'prompt' || state === 'denied') {
    return state
  }
  return null
}

export async function queryDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite'
): Promise<DirectoryPermissionState> {
  const permissionHandle = handle as PermissionHandle
  if (permissionHandle.queryPermission === undefined) {
    const injected = e2eInjectedPermission()
    if (injected !== null) return injected
    return 'granted'
  }
  const state = await permissionHandle.queryPermission({ mode })
  return normalizeState(state)
}

/** Request folder access inside a user-gesture handler. */
export async function requestDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite'
): Promise<DirectoryPermissionState> {
  const permissionHandle = handle as PermissionHandle
  if (permissionHandle.requestPermission === undefined) {
    const injected = e2eInjectedPermission()
    if (injected !== null) {
      const win = window as unknown as {
        __e2eDirectoryPermission?: string
        __e2eDirectoryPermissionRequestResult?: string
      }
      if (injected === 'prompt') {
        const next = win.__e2eDirectoryPermissionRequestResult ?? 'granted'
        win.__e2eDirectoryPermission = next
        return next === 'denied' ? 'denied' : 'granted'
      }
      return injected
    }
    return 'granted'
  }
  const state = await permissionHandle.requestPermission({ mode })
  return normalizeState(state)
}
