import type { Page } from '@playwright/test'
import { SHEET_NAMES } from '../../../src/services/sheets/config'

const METADATA_FILENAME = 'illo3d.metadata.json'

function fixtureFileList(): string[] {
  return [METADATA_FILENAME, ...SHEET_NAMES.map((s) => `${s}.csv`)]
}

/**
 * Replaces `showDirectoryPicker` on the live page with a handle backed by in-memory files
 * loaded from `/fixtures/<scenario>/` (served by the e2e Vite server).
 *
 * Missing fixture files other than the metadata are skipped — pre-v2 shops
 * legitimately have no `audit_log.csv`.
 *
 * The handle supports subdirectories (`getDirectoryHandle`, `entries`, `removeEntry`)
 * so the migration wizard's working-copy flow works against it.
 *
 * Playwright's Chromium often has no `navigator.storage` (OPFS) on non-localhost HTTP
 * origins (e.g. `http://web:5174` in Docker), so we do not use OPFS here.
 *
 * To survive `page.goto()` navigations within the same test, fixture data is stored in
 * `localStorage` and an init script recreates the mock handle on every page load.
 */
export async function mockDirectoryPicker(
  page: Page,
  scenario: string,
  mode: 'with-metadata' | 'empty'
): Promise<void> {
  const files = mode === 'empty' ? [] : fixtureFileList()

  // Fetch fixture files and persist them in localStorage so they survive navigations.
  await page.evaluate(
    async ({ scen, fileNames, metadataFile }) => {
      async function asWriteChunk(data: unknown): Promise<string> {
        if (typeof data === 'string') return data
        if (data instanceof Blob) return await data.text()
        if (data instanceof ArrayBuffer) return new TextDecoder().decode(data)
        if (ArrayBuffer.isView(data)) {
          const v = data as ArrayBufferView
          return new TextDecoder().decode(
            v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength),
          )
        }
        return String(data)
      }

      function memFileHandle(rel: string, store: Record<string, string>) {
        return {
          kind: 'file' as const,
          async getFile(): Promise<File> {
            const body = store[rel] ?? ''
            return new File([body], rel, { type: 'text/plain' })
          },
          async createWritable(options?: { keepExistingData?: boolean }) {
            let position = 0
            let buffer = options?.keepExistingData ? String(store[rel] ?? '') : ''
            return {
              async write(data: unknown) {
                const chunk = await asWriteChunk(data)
                buffer =
                  buffer.slice(0, position) + chunk + buffer.slice(position + chunk.length)
                position += chunk.length
              },
              async seek(offset: number) {
                position = offset
              },
              async close() {
                store[rel] = buffer
              },
            }
          },
        }
      }

      type MemDirHandle = {
        kind: 'directory'
        name: string
        getFileHandle(rel: string, options?: { create?: boolean }): Promise<unknown>
        getDirectoryHandle(rel: string, options?: { create?: boolean }): Promise<MemDirHandle>
        removeEntry(rel: string, options?: { recursive?: boolean }): Promise<void>
        entries(): AsyncGenerator<[string, unknown]>
      }

      function memDirHandle(name: string, initial: Record<string, string>): MemDirHandle {
        const filesMap: Record<string, string> = { ...initial }
        const dirsMap: Record<string, MemDirHandle> = {}
        return {
          kind: 'directory',
          name,
          async getFileHandle(rel: string, options?: { create?: boolean }) {
            const create = options?.create === true
            if (!(rel in filesMap)) {
              if (!create) {
                throw new DOMException('The requested file could not be found.', 'NotFoundError')
              }
              filesMap[rel] = ''
            }
            return memFileHandle(rel, filesMap)
          },
          async getDirectoryHandle(rel: string, options?: { create?: boolean }) {
            const create = options?.create === true
            if (!(rel in dirsMap)) {
              if (!create) {
                throw new DOMException('The requested directory could not be found.', 'NotFoundError')
              }
              dirsMap[rel] = memDirHandle(rel, {})
            }
            return dirsMap[rel]
          },
          async removeEntry(rel: string) {
            delete filesMap[rel]
            delete dirsMap[rel]
          },
          async *entries() {
            for (const rel of Object.keys(filesMap)) {
              yield [rel, { kind: 'file' as const }] as [string, unknown]
            }
            for (const rel of Object.keys(dirsMap)) {
              yield [rel, dirsMap[rel]] as [string, unknown]
            }
          },
        }
      }

      const storage: Record<string, string> = {}
      for (const f of fileNames as string[]) {
        const res = await fetch(`/fixtures/${scen}/${f}`)
        if (!res.ok) {
          if (f === metadataFile) {
            throw new Error(`Missing fixture file: ${scen}/${f} (${res.status})`)
          }
          continue
        }
        storage[f] = await res.text()
      }

      const rootName = `e2e-shop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const handle = memDirHandle(rootName, storage) as unknown as FileSystemDirectoryHandle

      const w = window as unknown as {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
        __e2eMockDirectoryHandle: FileSystemDirectoryHandle
      }
      w.showDirectoryPicker = async (): Promise<FileSystemDirectoryHandle> => handle
      w.__e2eMockDirectoryHandle = handle

      localStorage.setItem('__e2eFixtureFiles', JSON.stringify(storage))
      localStorage.setItem('__e2eFixtureScenario', scen)
    },
    { scen: scenario, fileNames: files, metadataFile: METADATA_FILENAME },
  )

  // Register an init script that recreates the mock handle on every page load.
  await page.addInitScript(() => {
    const raw = localStorage.getItem('__e2eFixtureFiles')
    const scen = localStorage.getItem('__e2eFixtureScenario')
    if (!raw || !scen) return

    const storage: Record<string, string> = JSON.parse(raw)

    function memFileHandle(rel: string, store: Record<string, string>) {
      return {
        kind: 'file' as const,
        async getFile(): Promise<File> {
          const body = store[rel] ?? ''
          return new File([body], rel, { type: 'text/plain' })
        },
        async createWritable(options?: { keepExistingData?: boolean }) {
          let position = 0
          let buffer = options?.keepExistingData ? String(store[rel] ?? '') : ''
          return {
            async write(data: unknown) {
              const chunk =
                typeof data === 'string'
                  ? data
                  : data instanceof Blob
                    ? await data.text()
                    : data instanceof ArrayBuffer
                      ? new TextDecoder().decode(data)
                      : ArrayBuffer.isView(data)
                        ? new TextDecoder().decode(
                            data.buffer.slice(
                              data.byteOffset,
                              data.byteOffset + data.byteLength,
                            ),
                          )
                        : String(data)
              buffer =
                buffer.slice(0, position) +
                chunk +
                buffer.slice(position + chunk.length)
              position += chunk.length
            },
            async seek(offset: number) {
              position = offset
            },
            async close() {
              store[rel] = buffer
            },
          }
        },
      }
    }

    type MemDirHandle = {
      kind: 'directory'
      name: string
      getFileHandle(rel: string, options?: { create?: boolean }): Promise<unknown>
      getDirectoryHandle(rel: string, options?: { create?: boolean }): Promise<MemDirHandle>
      removeEntry(rel: string, options?: { recursive?: boolean }): Promise<void>
      entries(): AsyncGenerator<[string, unknown]>
    }

    function memDirHandle(name: string, initial: Record<string, string>): MemDirHandle {
      const filesMap: Record<string, string> = { ...initial }
      const dirsMap: Record<string, MemDirHandle> = {}
      return {
        kind: 'directory',
        name,
        async getFileHandle(rel: string, options?: { create?: boolean }) {
          const create = options?.create === true
          if (!(rel in filesMap)) {
            if (!create) {
              throw new DOMException(
                'The requested file could not be found.',
                'NotFoundError',
              )
            }
            filesMap[rel] = ''
          }
          return memFileHandle(rel, filesMap)
        },
        async getDirectoryHandle(rel: string, options?: { create?: boolean }) {
          const create = options?.create === true
          if (!(rel in dirsMap)) {
            if (!create) {
              throw new DOMException(
                'The requested directory could not be found.',
                'NotFoundError',
              )
            }
            dirsMap[rel] = memDirHandle(rel, {})
          }
          return dirsMap[rel]
        },
        async removeEntry(rel: string) {
          delete filesMap[rel]
          delete dirsMap[rel]
        },
        async *entries() {
          for (const rel of Object.keys(filesMap)) {
            yield [rel, { kind: 'file' as const }] as [string, unknown]
          }
          for (const rel of Object.keys(dirsMap)) {
            yield [rel, dirsMap[rel]] as [string, unknown]
          }
        },
      }
    }

    const rootName = `e2e-shop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const handle = memDirHandle(rootName, storage) as unknown as FileSystemDirectoryHandle

    const w = window as unknown as {
      showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
      __e2eMockDirectoryHandle: FileSystemDirectoryHandle
    }
    w.showDirectoryPicker = async (): Promise<FileSystemDirectoryHandle> => handle
    w.__e2eMockDirectoryHandle = handle
  })
}
