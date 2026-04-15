import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchJobNotes } from './fetchJobNotes'

const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
  }),
}))

describe('fetchJobNotes', () => {
  beforeEach(() => {
    mockReadRows.mockReset()
  })

  it('parses valid rows and sorts by created_at descending', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet !== 'crm_notes') return Promise.resolve([])
      return Promise.resolve([
        {
          id: 'JN1',
          entity_type: 'job',
          entity_id: 'J1',
          body: 'A',
          referenced_entity_ids: '',
          severity: 'info',
          created_at: '2025-01-02T00:00:00.000Z',
        },
        {
          id: 'JN2',
          entity_type: 'job',
          entity_id: 'J1',
          body: 'B',
          referenced_entity_ids: 'P1',
          severity: 'warning',
          created_at: '2025-01-03T00:00:00.000Z',
        },
      ])
    })

    const rows = await fetchJobNotes('s1')
    expect(rows.map((r) => r.id)).toEqual(['JN2', 'JN1'])
    expect(rows[0].job_id).toBe('J1')
    expect(rows[0].severity).toBe('warning')
  })

  it('skips rows with invalid severity', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet !== 'crm_notes') return Promise.resolve([])
      return Promise.resolve([
        {
          id: 'JN1',
          entity_type: 'job',
          entity_id: 'J1',
          body: 'x',
          referenced_entity_ids: '',
          severity: 'bogus',
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ])
    })
    await expect(fetchJobNotes('s1')).resolves.toEqual([])
  })
})
