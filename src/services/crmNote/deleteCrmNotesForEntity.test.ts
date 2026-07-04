import { describe, it, expect, beforeEach } from 'vitest'
import { deleteCrmNotesForEntity } from './deleteCrmNotesForEntity'
import { getAllCurrentNotes } from '@/services/audit/reconstruct'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

function auditRow(obj: Record<string, unknown>): Record<string, string | number | undefined> {
  return {
    id: String(obj.id),
    timestamp: String(obj.created_at),
    actor: 'local',
    entity_name: 'crm_note',
    entity_id: String(obj.id),
    action: 'create',
    before_json: '',
    after_json: JSON.stringify(obj),
    parent_entity_name: '',
    parent_entity_id: '',
  }
}

describe('deleteCrmNotesForEntity', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('deletes matching notes by emitting delete audit events', async () => {
    const cn1 = {
      id: 'CN1',
      entity_type: 'client',
      entity_id: 'CL1',
      body: 'a',
      referenced_entity_ids: '',
      severity: 'info',
      created_at: '2025-01-01',
      archived: '',
      deleted: '',
    }
    const cn2 = {
      id: 'CN2',
      entity_type: 'client',
      entity_id: 'CL1',
      body: 'b',
      referenced_entity_ids: '',
      severity: 'info',
      created_at: '2025-01-02',
      archived: '',
      deleted: '',
    }
    const jn1 = {
      id: 'JN1',
      entity_type: 'job',
      entity_id: 'J1',
      body: 'j',
      referenced_entity_ids: '',
      severity: 'info',
      created_at: '2025-01-01',
      archived: '',
      deleted: '',
    }

    resetAndSeedWorkbook({
      audit_log: matrixWithRows('audit_log', [
        auditRow(cn1),
        auditRow(cn2),
        auditRow(jn1),
      ]),
    })

    await deleteCrmNotesForEntity('s1', 'client', 'CL1')

    const notes = getAllCurrentNotes()
    expect(notes.map((n) => n.id).sort()).toEqual(['JN1'])
  })

})
