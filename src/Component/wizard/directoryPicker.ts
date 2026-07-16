/**
 * File System Access API shim. `showDirectoryPicker` is not in TypeScript's DOM
 * lib and exists only in Chromium browsers, so the wizard feature-detects it
 * and tells everyone else that Chrome is required.
 */
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite'
    }) => Promise<FileSystemDirectoryHandle>
  }
}

export function isDirectoryPickerSupported(): boolean {
  return typeof window.showDirectoryPicker === 'function'
}

/** True for the DOMException the browser throws when the user dismisses the picker. */
export function isPickerAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/** Only call after `isDirectoryPickerSupported()`. */
export function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  const picker = window.showDirectoryPicker
  if (picker === undefined) {
    return Promise.reject(new Error('showDirectoryPicker is unavailable'))
  }
  return picker({ mode: 'readwrite' })
}
