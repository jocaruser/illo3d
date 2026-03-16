import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocalSheetsRepository } from './LocalSheetsRepository'
import { useBackendStore } from '@/stores/backendStore'
import { useAuthStore } from '@/stores/authStore'

function createMockHandle(files: Record<string, string>): FileSystemDirectoryHandle {
  const storage = { ...files }
  return {
    name: 'test-shop',
    getFileHandle: vi.fn(
      async (name: string, options?: { create?: boolean }) => {
        if (options?.create) {
          return {
            createWritable: vi.fn((opts?: { keepExistingData?: boolean }) => {
              let content = opts?.keepExistingData ? storage[name] ?? '' : ''
              return {
                write: vi.fn(async (data: string) => {
                  content += data
                  storage[name] = content
                }),
                seek: vi.fn(async (pos: number) => {
                  content = storage[name] ?? ''
                  content = content.slice(0, pos)
                  storage[name] = content
                }),
                close: vi.fn(async () => {}),
              }
            }),
          } as unknown as FileSystemFileHandle
        }
        const content = storage[name]
        if (!content) throw new Error('File not found')
        return {
          getFile: vi.fn(async () => ({
            text: vi.fn(async () => content),
          })),
        } as unknown as FileSystemFileHandle
      }
    ),
  } as unknown as FileSystemDirectoryHandle
}

describe('LocalSheetsRepository', () => {
  beforeEach(() => {
    useBackendStore.setState({ localDirectoryHandle: null })
    useAuthStore.setState({
      user: { email: 'dev@illo3d.local', name: 'Dev User' },
    })
  })

  it('readRows parses CSV and returns objects keyed by headers', async () => {
    const csv =
      'id,date,type,amount,category,concept,ref_type,ref_id,client_id,notes\n' +
      't1,2025-01-15,income,100.50,Sales,Print job A,,,c1,First sale'
    const handle = createMockHandle({ 'transactions.csv': csv })
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalSheetsRepository()
    const rows = await repo.readRows('local-test-shop', 'transactions')

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 't1',
      date: '2025-01-15',
      type: 'income',
      amount: '100.50',
      category: 'Sales',
      concept: 'Print job A',
      client_id: 'c1',
      notes: 'First sale',
    })
  })

  it('readRows returns empty array when CSV has only headers', async () => {
    const handle = createMockHandle({
      'transactions.csv':
        'id,date,type,amount,category,concept,ref_type,ref_id,client_id,notes',
    })
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalSheetsRepository()
    const rows = await repo.readRows('local-test-shop', 'transactions')

    expect(rows).toEqual([])
  })

  it('getSheetNames returns SHEET_NAMES', async () => {
    const handle = createMockHandle({ 'transactions.csv': 'id,date\n' })
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalSheetsRepository()
    const names = await repo.getSheetNames('local-test-shop')

    expect(names).toContain('transactions')
    expect(names).toContain('clients')
    expect(names).toContain('expenses')
  })

  it('getHeaderRow returns first line of CSV as headers', async () => {
    const handle = createMockHandle({
      'transactions.csv':
        'id,date,type,amount,category,concept,ref_type,ref_id,client_id,notes',
    })
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalSheetsRepository()
    const headers = await repo.getHeaderRow('local-test-shop', 'transactions')

    expect(headers).toEqual([
      'id',
      'date',
      'type',
      'amount',
      'category',
      'concept',
      'ref_type',
      'ref_id',
      'client_id',
      'notes',
    ])
  })

  it('createSpreadsheet writes metadata and CSV files and returns spreadsheet id', async () => {
    const handle = createMockHandle({})
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalSheetsRepository()
    const id = await repo.createSpreadsheet()

    expect(id).toBe('local-test-shop')
    expect(handle.getFileHandle).toHaveBeenCalledWith('illo3d.metadata.json', {
      create: true,
    })
    const metadataCall = (handle.getFileHandle as ReturnType<typeof vi.fn>).mock
      .calls[0]
    expect(metadataCall[0]).toBe('illo3d.metadata.json')
  })

  it('appendRows appends rows to existing CSV file', async () => {
    const initial =
      'id,date,category,amount,notes\n' +
      'e1,2025-01-20,Materials,25.00,Test'
    const handle = createMockHandle({ 'expenses.csv': initial })
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalSheetsRepository()
    await repo.appendRows('local-test-shop', 'expenses', [
      { id: 'e2', date: '2025-01-21', category: 'Other', amount: '10.00', notes: '' },
    ])

    expect(handle.getFileHandle).toHaveBeenCalledWith('expenses.csv', {
      create: true,
    })
  })

  it('throws when no local directory handle is set', async () => {
    const repo = new LocalSheetsRepository()

    await expect(repo.readRows('id', 'transactions')).rejects.toThrow(
      'No local directory handle set'
    )
    await expect(repo.createSpreadsheet()).rejects.toThrow(
      'No local directory handle set'
    )
  })
})
