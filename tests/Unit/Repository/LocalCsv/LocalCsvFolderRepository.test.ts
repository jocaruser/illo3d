import { describe, expect, it } from 'vitest'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { LocalCsvFolderRepository } from '@/Repository/LocalCsv/LocalCsvFolderRepository'
import { createFakeDirectory } from './fakeDirectoryHandle'

const FOLDER_ID = 'local-shop'

const metadata: ShopMetadata = {
  app: 'illo3d',
  version: '3.0.0',
  spreadsheetId: 'local-shop',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'local',
}

describe('LocalCsvFolderRepository', () => {
  it('returns null when the metadata file is missing', async () => {
    const repository = new LocalCsvFolderRepository(
      createFakeDirectory().handle
    )
    expect(await repository.readMetadata(FOLDER_ID)).toBeNull()
  })

  it('returns null when the metadata file is not valid JSON', async () => {
    const { handle } = createFakeDirectory('shop', {
      'illo3d.metadata.json': 'not json {',
    })
    const repository = new LocalCsvFolderRepository(handle)
    expect(await repository.readMetadata(FOLDER_ID)).toBeNull()
  })

  it('returns null when the JSON is not shop metadata', async () => {
    const { handle } = createFakeDirectory('shop', {
      'illo3d.metadata.json': '{"app":"other","version":3}',
    })
    const repository = new LocalCsvFolderRepository(handle)
    expect(await repository.readMetadata(FOLDER_ID)).toBeNull()
  })

  it('reads valid metadata', async () => {
    const { handle } = createFakeDirectory('shop', {
      'illo3d.metadata.json': JSON.stringify(metadata),
    })
    const repository = new LocalCsvFolderRepository(handle)
    expect(await repository.readMetadata(FOLDER_ID)).toEqual(metadata)
  })

  it('writes pretty-printed metadata that reads back identically', async () => {
    const { handle, files } = createFakeDirectory()
    const repository = new LocalCsvFolderRepository(handle)
    await repository.writeMetadata(FOLDER_ID, metadata)
    expect(files.get('illo3d.metadata.json')).toBe(
      JSON.stringify(metadata, null, 2)
    )
    expect(await repository.readMetadata(FOLDER_ID)).toEqual(metadata)
  })

  it('returns the directory name as the folder name', async () => {
    const repository = new LocalCsvFolderRepository(
      createFakeDirectory('taller-3d').handle
    )
    expect(await repository.getFolderName(FOLDER_ID)).toBe('taller-3d')
  })
})
