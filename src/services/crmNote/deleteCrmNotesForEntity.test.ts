import { describe, it, expect, beforeEach } from 'vitest'
import { deleteCrmNotesForEntity } from './deleteCrmNotesForEntity'
import { matrixToCrmNotes } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('deleteCrmNotesForEntity', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('deletes matching rows in reverse index order', async () => {
    resetAndSeedWorkbook({
      crm_notes: matrixWithRows('crm_notes', [
        {
          id: 'CN1',
          entity_type: 'client',
          entity_id: 'CL1',
          body: 'a',
          referenced_entity_ids: '',
          severity: 'info',
          created_at: '2025-01-01',
        },
        {
          id: 'CN2',
          entity_type: 'client',
          entity_id: 'CL1',
          body: 'b',
          referenced_entity_ids: '',
          severity: 'info',
          created_at: '2025-01-02',
        },
        {
          id: 'JN1',
          entity_type: 'job',
          entity_id: 'J1',
          body: 'j',
          referenced_entity_ids: '',
          severity: 'info',
          created_at: '2025-01-01',
        },
      ]),
    })

    await deleteCrmNotesForEntity('s1', 'client', 'CL1')

    const notes = matrixToCrmNotes(useWorkbookStore.getState().tabs.crm_notes)
    expect(notes.map((n) => n.id).sort()).toEqual(['JN1'])
  })

  it('matches unknown future entity_type strings', async () => {
    resetAndSeedWorkbook({
      crm_notes: matrixWithRows('crm_notes', [
        {
          id: 'N1',
          entity_type: 'workspace',
          entity_id: 'W1',
          body: '',
          referenced_entity_ids: '',
          severity: 'info',
          created_at: '2025-01-01',
        },
      ]),
    })

    await deleteCrmNotesForEntity('s1', 'workspace', 'W1')

    expect(
      matrixToCrmNotes(useWorkbookStore.getState().tabs.crm_notes),
    ).toHaveLength(0)
  })
})
