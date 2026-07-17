/**
 * In-memory stand-in for a `FileSystemDirectoryHandle`, implementing just the
 * surface the LocalCsv repositories touch: getFileHandle (with create),
 * getFile().text(), createWritable().write/close, keys().
 */

export interface FakeDirectory {
  handle: FileSystemDirectoryHandle
  /** Backing store: file name → current content. */
  files: Map<string, string>
}

export function createFakeDirectory(
  name = 'shop',
  initialFiles: Record<string, string> = {}
): FakeDirectory {
  const files = new Map(Object.entries(initialFiles))
  const handle = {
    kind: 'directory' as const,
    name,
    async getFileHandle(fileName: string, options?: { create?: boolean }) {
      if (!files.has(fileName)) {
        if (!options?.create) throw new Error(`NotFoundError: ${fileName}`)
        files.set(fileName, '')
      }
      return {
        kind: 'file' as const,
        name: fileName,
        async getFile() {
          return { text: async () => files.get(fileName) ?? '' }
        },
        async createWritable() {
          let buffer = ''
          return {
            async write(chunk: string) {
              buffer += chunk
            },
            async close() {
              files.set(fileName, buffer)
            },
          }
        },
      }
    },
    async *keys() {
      yield* files.keys()
    },
  }
  return { handle: handle as unknown as FileSystemDirectoryHandle, files }
}
