export const FILE_SYSTEM_ACCESS_NOT_SUPPORTED =
  'File System Access API is not supported in this browser. Please use a Chromium-based browser (Chrome, Edge, Brave, etc.).'

export function isDirectoryPickerSupported(): boolean {
  return 'showDirectoryPicker' in window
}

export async function showDirectoryPicker(): Promise<FileSystemDirectoryHandle | null> {
  if (!isDirectoryPickerSupported()) {
    throw new Error(FILE_SYSTEM_ACCESS_NOT_SUPPORTED)
  }
  try {
    const handle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
    return handle
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return null
    throw err
  }
}
