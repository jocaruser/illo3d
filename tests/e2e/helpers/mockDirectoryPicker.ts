import type { Page } from '@playwright/test'
import { SHEET_NAMES } from '../../../src/services/sheets/config'

function fixtureFileList(): string[] {
  return ['illo3d.metadata.json', ...SHEET_NAMES.map((s) => `${s}.csv`)]
}

/**
 * Replaces `showDirectoryPicker` on the live page with a handle backed by in-memory files
 * loaded from `/fixtures/<scenario>/` (served by the e2e Vite server).
 *
 * Playwright's Chromium often has no `navigator.storage` (OPFS) on non-localhost HTTP
 * origins (e.g. `http://web:5174` in Docker), so we do not use OPFS here.
 */
export async function mockDirectoryPicker(
  page: Page,
  scenario: string,
  mode: 'with-metadata' | 'empty'
): Promise<void> {
  const files = mode === 'empty' ? [] : fixtureFileList()
  await page.evaluate(
    async ({ scen, fileNames }) => {
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

      function memDirHandle(name: string, initial: Record<string, string>) {
        const filesMap: Record<string, string> = { ...initial }
        return {
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
        }
      }

      const storage: Record<string, string> = {}
      for (const f of fileNames as string[]) {
        const res = await fetch(`/fixtures/${scen}/${f}`)
        if (!res.ok) {
          throw new Error(`Missing fixture file: ${scen}/${f} (${res.status})`)
        }
        storage[f] = await res.text()
      }

      const rootName = `e2e-shop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const w = window as unknown as {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
      }
      w.showDirectoryPicker = async (): Promise<FileSystemDirectoryHandle> =>
        memDirHandle(rootName, storage) as unknown as FileSystemDirectoryHandle
    },
    { scen: scenario, fileNames: files },
  )
}
