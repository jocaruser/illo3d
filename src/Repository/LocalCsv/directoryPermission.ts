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
export async function queryDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite'
): Promise<DirectoryPermissionState> {
  const permissionHandle = handle as PermissionHandle
  if (permissionHandle.queryPermission === undefined) return 'granted'
  const state = await permissionHandle.queryPermission({ mode })
  return normalizeState(state)
}

/** Request folder access inside a user-gesture handler. */
export async function requestDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite'
): Promise<DirectoryPermissionState> {
  const permissionHandle = handle as PermissionHandle
  if (permissionHandle.requestPermission === undefined) return 'granted'
  const state = await permissionHandle.requestPermission({ mode })
  return normalizeState(state)
}
