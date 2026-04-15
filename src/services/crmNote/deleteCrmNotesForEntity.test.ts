import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteCrmNotesForEntity } from './deleteCrmNotesForEntity'

const mockDeleteRow = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    deleteRow: mockDeleteRow,
  }),
}))

describe('deleteCrmNotesForEntity', () => {
  beforeEach(() => {
    mockDeleteRow.mockReset()
    mockReadRows.mockReset()
  })

  it('deletes matching rows in reverse index order', async () => {
    mockReadRows.mockResolvedValue([
      {
        id: 'CN1',
        entity_type: 'client',
        entity_id: 'CL1',
        body: 'a',
        referenced_entity_ids: '',
        severity: 'info',
        created_at: '',
      },
      {
        id: 'CN2',
        entity_type: 'client',
        entity_id: 'CL1',
        body: 'b',
        referenced_entity_ids: '',
        severity: 'info',
        created_at: '',
      },
      {
        id: 'JN1',
        entity_type: 'job',
        entity_id: 'J1',
        body: 'j',
        referenced_entity_ids: '',
        severity: 'info',
        created_at: '',
      },
    ])

    await deleteCrmNotesForEntity('s1', 'client', 'CL1')

    expect(mockDeleteRow.mock.calls).toEqual([
      ['s1', 'crm_notes', 2],
      ['s1', 'crm_notes', 1],
    ])
  })

  it('matches unknown future entity_type strings', async () => {
    mockReadRows.mockResolvedValue([
      {
        id: 'N1',
        entity_type: 'workspace',
        entity_id: 'W1',
        body: '',
        referenced_entity_ids: '',
        severity: 'info',
        created_at: '',
      },
    ])

    await deleteCrmNotesForEntity('s1', 'workspace', 'W1')

    expect(mockDeleteRow).toHaveBeenCalledWith('s1', 'crm_notes', 1)
  })
})
