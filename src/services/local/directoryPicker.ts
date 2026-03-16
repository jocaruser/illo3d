export function isDirectoryPickerSupported(): boolean {
  return 'showDirectoryPicker' in window
}

export async function showDirectoryPicker(): Promise<FileSystemDirectoryHandle | null> {
  if (!isDirectoryPickerSupported()) {
    throw new Error('File System Access API is not supported. Please use Chrome.')
  }
  try {
    const handle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
    return handle
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return null
    throw err
  }
}
