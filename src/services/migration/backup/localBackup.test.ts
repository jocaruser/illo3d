import { describe, it, expect } from 'vitest'
import { createLocalMigrationTarget } from './localBackup'

interface FakeDirectory {
  name: string
  kind: 'directory'
  files: Map<string, string>
  dirs: Map<string, FakeDirectory>
  getFileHandle(
    fileName: string,
    opts?: { create?: boolean }
  ): Promise<unknown>
  getDirectoryHandle(
    dirName: string,
    opts?: { create?: boolean }
  ): Promise<FakeDirectory>
  removeEntry(entryName: string, opts?: { recursive?: boolean }): Promise<void>
  entries(): AsyncGenerator<[string, { kind: 'file' | 'directory' }]>
}

function fakeDirectory(name: string): FakeDirectory {
  const files = new Map<string, string>()
  const dirs = new Map<string, FakeDirectory>()
  return {
    name,
    kind: 'directory',
    files,
    dirs,
    async getFileHandle(fileName: string, opts?: { create?: boolean }) {
      if (!files.has(fileName)) {
        if (!opts?.create) throw new Error(`File not found: ${fileName}`)
        files.set(fileName, '')
      }
      return {
        kind: 'file',
        async getFile() {
          return { text: async () => files.get(fileName) ?? '' }
        },
        async createWritable() {
          let content = ''
          return {
            async write(chunk: string) {
              content += chunk
            },
            async close() {
              files.set(fileName, content)
            },
          }
        },
      }
    },
    async getDirectoryHandle(dirName: string, opts?: { create?: boolean }) {
      if (!dirs.has(dirName)) {
        if (!opts?.create) throw new Error(`Directory not found: ${dirName}`)
        dirs.set(dirName, fakeDirectory(dirName))
      }
      return dirs.get(dirName)!
    },
    async removeEntry(entryName: string) {
      dirs.delete(entryName)
      files.delete(entryName)
    },
    async *entries() {
      for (const [fileName] of files) {
        yield [fileName, { kind: 'file' as const }]
      }
      for (const [dirName] of dirs) {
        yield [dirName, { kind: 'directory' as const }]
      }
    },
  }
}

const METADATA = JSON.stringify({
  app: 'illo3d',
  version: '1.5.0',
  spreadsheetId: 'local-shop',
  createdAt: '2025-01-01T00:00:00.000Z',
  createdBy: 'dev@illo3d.local',
})

function fakeShop(): FakeDirectory {
  const shop = fakeDirectory('shop')
  shop.files.set('illo3d.metadata.json', METADATA)
  shop.files.set('clients.csv', 'id,name\nC1,Ann\n')
  shop.files.set('jobs.csv', 'id,client_id\nJ1,C1\n')
  return shop
}

function targetFor(shop: FakeDirectory) {
  return createLocalMigrationTarget({
    shopHandle: shop as unknown as FileSystemDirectoryHandle,
    fromVersion: '1.5.0',
    toVersion: '2.0.0',
  })
}

function workingFolderOf(shop: FakeDirectory): FakeDirectory {
  const working = [...shop.dirs.values()].find((dir) =>
    dir.name.endsWith('.migration')
  )
  expect(working).toBeDefined()
  return working!
}

describe('createLocalMigrationTarget', () => {
  it('copies every shop file into a working folder named after the versions', async () => {
    const shop = fakeShop()
    await targetFor(shop).createWorkingCopy()

    const working = workingFolderOf(shop)
    expect(working.name).toContain('v1.5.0.v2.0.0')
    expect(working.files.get('clients.csv')).toBe('id,name\nC1,Ann\n')
    expect(working.files.get('jobs.csv')).toBe('id,client_id\nJ1,C1\n')
    expect(working.files.get('illo3d.metadata.json')).toBe(METADATA)
  })

  it('does not copy subdirectories into the working folder', async () => {
    const shop = fakeShop()
    shop.dirs.set('old-backup', fakeDirectory('old-backup'))
    await targetFor(shop).createWorkingCopy()

    const working = workingFolderOf(shop)
    expect(working.dirs.size).toBe(0)
    expect(working.files.has('old-backup')).toBe(false)
  })

  it('leaves the source files untouched while steps write to the working copy', async () => {
    const shop = fakeShop()
    await targetFor(shop).createWorkingCopy()

    const working = workingFolderOf(shop)
    working.files.set('clients.csv', 'id,name,archived,deleted\nC1,Ann,,\n')

    expect(shop.files.get('clients.csv')).toBe('id,name\nC1,Ann\n')
  })

  it('commit copies working files up, flips the metadata version, and removes the working folder', async () => {
    const shop = fakeShop()
    const workingCopy = await targetFor(shop).createWorkingCopy()
    const working = workingFolderOf(shop)
    working.files.set('clients.csv', 'id,name,archived,deleted\nC1,Ann,,\n')

    await workingCopy.commit({ keepOriginalAsBackup: false })

    expect(shop.files.get('clients.csv')).toBe(
      'id,name,archived,deleted\nC1,Ann,,\n'
    )
    const metadata = JSON.parse(shop.files.get('illo3d.metadata.json')!)
    expect(metadata.version).toBe('2.0.0')
    expect(metadata.spreadsheetId).toBe('local-shop')
    expect(
      [...shop.dirs.values()].some((dir) => dir.name.endsWith('.migration'))
    ).toBe(false)
  })

  it('commit with keepOriginalAsBackup retains the original v1 files in a backup folder', async () => {
    const shop = fakeShop()
    const workingCopy = await targetFor(shop).createWorkingCopy()
    workingFolderOf(shop).files.set(
      'clients.csv',
      'id,name,archived,deleted\nC1,Ann,,\n'
    )

    await workingCopy.commit({ keepOriginalAsBackup: true })

    const backup = [...shop.dirs.values()].find((dir) =>
      dir.name.endsWith('.backup')
    )
    expect(backup).toBeDefined()
    expect(backup!.name).toContain('v1.5.0')
    expect(backup!.files.get('clients.csv')).toBe('id,name\nC1,Ann\n')
    expect(JSON.parse(backup!.files.get('illo3d.metadata.json')!).version).toBe(
      '1.5.0'
    )
  })

  it('commit without backup leaves no backup folder', async () => {
    const shop = fakeShop()
    const workingCopy = await targetFor(shop).createWorkingCopy()

    await workingCopy.commit({ keepOriginalAsBackup: false })

    expect(
      [...shop.dirs.values()].some((dir) => dir.name.endsWith('.backup'))
    ).toBe(false)
  })

  it('ensureSheet creates a header-only csv when the sheet file is missing', async () => {
    const shop = fakeShop()
    const workingCopy = await targetFor(shop).createWorkingCopy()

    await workingCopy.ctx.ensureSheet('audit_log')

    const working = workingFolderOf(shop)
    expect(working.files.get('audit_log.csv')).toContain('id,timestamp,actor')
  })

  it('ensureSheet keeps an existing csv untouched', async () => {
    const shop = fakeShop()
    const workingCopy = await targetFor(shop).createWorkingCopy()
    const working = workingFolderOf(shop)
    working.files.set('audit_log.csv', 'existing-content')

    await workingCopy.ctx.ensureSheet('audit_log')

    expect(working.files.get('audit_log.csv')).toBe('existing-content')
  })
})
