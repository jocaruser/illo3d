import {
  queryDirectoryPermission,
  requestDirectoryPermission,
} from '@/Repository/LocalCsv/directoryPermission'
import { createFakeDirectory } from './fakeDirectoryHandle'

describe('directoryPermission', () => {
  it('reports granted when query returns granted', async () => {
    const { handle } = createFakeDirectory('shop', {}, 'granted')
    await expect(queryDirectoryPermission(handle, 'readwrite')).resolves.toBe(
      'granted'
    )
  })

  it('reports prompt when query returns prompt', async () => {
    const { handle } = createFakeDirectory('shop', {}, 'prompt')
    await expect(queryDirectoryPermission(handle, 'readwrite')).resolves.toBe(
      'prompt'
    )
  })

  it('reports denied when query returns denied', async () => {
    const { handle } = createFakeDirectory('shop', {}, 'denied')
    await expect(queryDirectoryPermission(handle, 'readwrite')).resolves.toBe(
      'denied'
    )
  })

  it('requestPermission promotes prompt to granted on the fake handle', async () => {
    const { handle } = createFakeDirectory('shop', {}, 'prompt')
    await expect(requestDirectoryPermission(handle, 'readwrite')).resolves.toBe(
      'granted'
    )
  })

  it('treats handles without permission methods as granted', async () => {
    const bare = {
      kind: 'directory' as const,
      name: 'legacy',
      async getFileHandle() {
        throw new Error('unused')
      },
    } as unknown as FileSystemDirectoryHandle
    await expect(queryDirectoryPermission(bare, 'readwrite')).resolves.toBe(
      'granted'
    )
    await expect(requestDirectoryPermission(bare, 'readwrite')).resolves.toBe(
      'granted'
    )
  })
})
