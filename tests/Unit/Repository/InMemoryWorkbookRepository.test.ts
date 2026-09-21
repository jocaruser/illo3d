import { describe, expect, it } from 'vitest'
import { SHEET_HEADERS } from '@/Config/schema'
import { InMemoryWorkbookRepository } from '@/Repository/InMemoryWorkbookRepository'

describe('InMemoryWorkbookRepository', () => {
  it('ensureSheet seeds canonical headers', async () => {
    const repo = new InMemoryWorkbookRepository()
    await repo.ensureSheet('wb', 'clients')
    expect(await repo.readSheetMatrix('wb', 'clients')).toEqual([
      [...SHEET_HEADERS.clients],
    ])
  })

  it('replaceSheetMatrix round-trips a copy', async () => {
    const repo = new InMemoryWorkbookRepository()
    await repo.replaceSheetMatrix('wb', 'tags', [['a'], ['b']])
    const matrix = await repo.readSheetMatrix('wb', 'tags')
    matrix[0][0] = 'mutated'
    expect(await repo.readSheetMatrix('wb', 'tags')).toEqual([['a'], ['b']])
  })
})
