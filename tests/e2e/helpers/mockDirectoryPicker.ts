import type { Page } from '@playwright/test'
import { SHEET_NAMES } from '../../../src/Config/schema'

/** Flat path → contents map. Directories are implied by `/`-separated prefixes. */
type FileStore = Record<string, string>

const STORE_KEY = '__e2eFixtureFiles'

function fixtureFileList(): string[] {
  return ['illo3d.metadata.json', ...SHEET_NAMES.map((s) => `${s}.csv`)]
}

/**
 * Installs an in-memory `showDirectoryPicker` on the page.
 *
 * Serialized into the browser by both `evaluate` and `addInitScript`, so it must
 * be entirely self-contained — no imports, no outer-scope references.
 *
 * The handle mirrors the slice of the File System Access API the app actually
 * uses: `getFileHandle`, `getDirectoryHandle`, `removeEntry` and `keys` (the
 * migration engine copies a shop into a working subdirectory, and
 * `LocalCsvWorkbookRepository.getSheetNames` iterates `keys()`). Writes flush to
 * `localStorage` so a Save survives a reload, matching a real folder.
 *
 * @param args.seed  fixture contents to install
 * @param args.force overwrite any store already in `localStorage` (a fresh
 *                   `mockDirectoryPicker` call resets; page loads restore)
 */
function installMock(args: { seed: FileStore; force: boolean }): void {
  const persisted = localStorage.getItem('__e2eFixtureFiles')
  const store: FileStore =
    !args.force && persisted !== null
      ? (JSON.parse(persisted) as FileStore)
      : { ...args.seed }

  const flush = (): void =>
    localStorage.setItem('__e2eFixtureFiles', JSON.stringify(store))
  flush()

  // Directories created but not yet written to; real ones exist before holding files.
  const emptyDirs = new Set<string>()

  async function chunkText(data: unknown): Promise<string> {
    if (typeof data === 'string') return data
    if (data instanceof Blob) return await data.text()
    if (data instanceof ArrayBuffer) return new TextDecoder().decode(data)
    if (ArrayBuffer.isView(data)) {
      const view = data as ArrayBufferView
      return new TextDecoder().decode(
        view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
      )
    }
    return String(data)
  }

  function fileHandle(path: string) {
    return {
      kind: 'file' as const,
      name: path.split('/').pop() ?? path,
      async getFile(): Promise<File> {
        return new File([store[path] ?? ''], path, { type: 'text/plain' })
      },
      async createWritable(options?: { keepExistingData?: boolean }) {
        let position = 0
        let buffer =
          options?.keepExistingData === true ? String(store[path] ?? '') : ''
        return {
          async write(data: unknown): Promise<void> {
            const chunk = await chunkText(data)
            buffer =
              buffer.slice(0, position) +
              chunk +
              buffer.slice(position + chunk.length)
            position += chunk.length
          },
          async seek(offset: number): Promise<void> {
            position = offset
          },
          async close(): Promise<void> {
            store[path] = buffer
            flush()
          },
        }
      },
    }
  }

  function notFound(what: string): DOMException {
    return new DOMException(`${what} could not be found.`, 'NotFoundError')
  }

  function dirHandle(name: string, prefix: string) {
    /** Immediate children: file names, plus the first segment of nested paths. */
    const childNames = (): string[] => {
      const names = new Set<string>()
      for (const path of Object.keys(store)) {
        if (!path.startsWith(prefix)) continue
        const rest = path.slice(prefix.length)
        if (rest === '') continue
        const slash = rest.indexOf('/')
        names.add(slash === -1 ? rest : rest.slice(0, slash))
      }
      for (const dir of emptyDirs) {
        if (!dir.startsWith(prefix)) continue
        const rest = dir.slice(prefix.length).replace(/\/$/, '')
        if (rest !== '' && !rest.includes('/')) names.add(rest)
      }
      return [...names]
    }

    return {
      kind: 'directory' as const,
      name,
      async getFileHandle(rel: string, options?: { create?: boolean }) {
        const path = prefix + rel
        if (!(path in store)) {
          if (options?.create !== true) throw notFound(`The file ${rel}`)
          store[path] = ''
          flush()
        }
        return fileHandle(path)
      },
      async getDirectoryHandle(rel: string, options?: { create?: boolean }) {
        const childPrefix = `${prefix + rel}/`
        const exists =
          emptyDirs.has(childPrefix) ||
          Object.keys(store).some((path) => path.startsWith(childPrefix))
        if (!exists) {
          if (options?.create !== true) throw notFound(`The directory ${rel}`)
          emptyDirs.add(childPrefix)
        }
        return dirHandle(rel, childPrefix)
      },
      async removeEntry(rel: string, options?: { recursive?: boolean }) {
        const path = prefix + rel
        const childPrefix = `${path}/`
        let removed = false
        if (path in store) {
          delete store[path]
          removed = true
        }
        for (const key of Object.keys(store)) {
          if (!key.startsWith(childPrefix)) continue
          if (options?.recursive !== true) {
            throw new DOMException(
              `${rel} is not empty.`,
              'InvalidModificationError'
            )
          }
          delete store[key]
          removed = true
        }
        for (const dir of [...emptyDirs]) {
          if (dir === childPrefix || dir.startsWith(childPrefix)) {
            emptyDirs.delete(dir)
            removed = true
          }
        }
        if (!removed) throw notFound(`The entry ${rel}`)
        flush()
      },
      async *keys(): AsyncIterableIterator<string> {
        for (const child of childNames()) yield child
      },
    }
  }

  const rootName = 'e2e-shop'
  const handle = dirHandle(rootName, '') as unknown as FileSystemDirectoryHandle

  const target = window as unknown as {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
    __e2eMockDirectoryHandle: FileSystemDirectoryHandle
  }
  target.showDirectoryPicker = async () => handle
  target.__e2eMockDirectoryHandle = handle
}

/**
 * Replaces `showDirectoryPicker` with a handle backed by in-memory copies of
 * `/fixtures/<scenario>/` (served by the e2e Vite server).
 *
 * OPFS is unavailable in Playwright's Chromium on non-localhost HTTP origins
 * (e.g. `http://web:5174` in Docker), hence the hand-rolled handle. The mock is
 * re-installed on every page load so it survives `page.goto()`.
 */
export async function mockDirectoryPicker(
  page: Page,
  scenario: string,
  mode: 'with-metadata' | 'empty'
): Promise<void> {
  const files = mode === 'empty' ? [] : fixtureFileList()

  const seed = await page.evaluate(
    async ({ scen, fileNames }) => {
      const loaded: Record<string, string> = {}
      for (const name of fileNames) {
        const response = await fetch(`/fixtures/${scen}/${name}`)
        if (!response.ok) {
          throw new Error(`Missing fixture file: ${scen}/${name} (${response.status})`)
        }
        loaded[name] = await response.text()
      }
      return loaded
    },
    { scen: scenario, fileNames: files }
  )

  await page.evaluate(installMock, { seed, force: true })
  await page.addInitScript(installMock, { seed, force: false })
}

export { STORE_KEY }
