import { describe, expect, it, vi } from 'vitest'
import { DATA_SHEET_NAMES, SHEET_HEADERS } from '@/Config/schema'
import { CreateAuditLogSheetStep } from '@/Migration/Plan/V1ToV2/CreateAuditLogSheetStep'
import { matrixToRecords } from '@/Repository/Matrix'
import {
  contextFor,
  FixedClock,
  InMemoryWorkbookRepository,
  RecordingReporter,
} from '../../helpers'

const NOW = '2026-07-16T10:00:00.000Z'

/** A repo where every data sheet is already canonical (lifecycle steps ran first). */
function canonicalRepo(): InMemoryWorkbookRepository {
  const repo = new InMemoryWorkbookRepository()
  for (const sheet of DATA_SHEET_NAMES) {
    repo.sheets.set(sheet, [[...SHEET_HEADERS[sheet]]])
  }
  return repo
}

function makeStep(): CreateAuditLogSheetStep {
  return new CreateAuditLogSheetStep(new FixedClock(NOW))
}

describe('CreateAuditLogSheetStep', () => {
  it('has the audit_log step id and a default system clock', () => {
    expect(new CreateAuditLogSheetStep().id).toBe('audit_log')
  })

  it('creates the audit_log sheet and reports both phases', async () => {
    const repo = canonicalRepo()
    const report = new RecordingReporter()
    await makeStep().migrate(contextFor(repo), report)
    expect(repo.sheets.get('audit_log')).toEqual([[...SHEET_HEADERS.audit_log]])
    expect(report.keys).toEqual([
      'wizard.migrationStepAuditSheet',
      'wizard.migrationStepAuditBackfill',
    ])
  })

  it('backfills one migration entry per existing row across all data sheets', async () => {
    const repo = canonicalRepo()
    repo.sheets.set('clients', [
      [...SHEET_HEADERS.clients],
      ['CL1', 'Ana', 'ana@x.test', '', '', '', '', '', '2024-01-01', '', ''],
      ['CL2', 'Bo', '', '', '', '', '', '', '2024-01-02', 'true', ''],
    ])
    repo.sheets.set('jobs', [
      [...SHEET_HEADERS.jobs],
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-01', '', '', ''],
    ])
    await makeStep().migrate(contextFor(repo), new RecordingReporter())

    const entries = matrixToRecords('audit_log', repo.sheets.get('audit_log')!)
    expect(entries).toHaveLength(3)
    expect(entries.map((entry) => entry.id)).toEqual(['AL1', 'AL2', 'AL3'])
    expect(
      entries.map((entry) => [entry.entity_name, entry.entity_id])
    ).toEqual([
      ['client', 'CL1'],
      ['client', 'CL2'],
      ['job', 'J1'],
    ])
    for (const entry of entries) {
      expect(entry.timestamp).toBe(NOW)
      expect(entry.actor).toBe('migration')
      expect(entry.action).toBe('migration')
      expect(entry.before_json).toBe('')
      expect(entry.fieldsChanged).toBe('')
      expect(entry.parent_entity_name).toBe('')
      expect(entry.parent_entity_id).toBe('')
    }
  })

  it('snapshots the row into after_json, dropping only empty lifecycle cells', async () => {
    const repo = canonicalRepo()
    repo.sheets.set('tags', [
      [...SHEET_HEADERS.tags],
      ['TG1', 'urgent', '2024-01-01', '', ''],
      ['TG2', 'fragile', '2024-01-02', 'true', 'true'],
    ])
    await makeStep().migrate(contextFor(repo), new RecordingReporter())

    const [plain, lifecycled] = matrixToRecords(
      'audit_log',
      repo.sheets.get('audit_log')!
    )
    expect(JSON.parse(plain.after_json)).toEqual({
      id: 'TG1',
      name: 'urgent',
      created_at: '2024-01-01',
    })
    expect(JSON.parse(lifecycled.after_json)).toEqual({
      id: 'TG2',
      name: 'fragile',
      created_at: '2024-01-02',
      archived: 'true',
      deleted: 'true',
    })
  })

  it('skips rows without an id', async () => {
    const repo = canonicalRepo()
    repo.sheets.set('tags', [
      [...SHEET_HEADERS.tags],
      ['  ', 'ghost', '2024-01-01', '', ''],
      ['TG1', 'real', '2024-01-01', '', ''],
    ])
    await makeStep().migrate(contextFor(repo), new RecordingReporter())
    const entries = matrixToRecords('audit_log', repo.sheets.get('audit_log')!)
    expect(entries.map((entry) => entry.entity_id)).toEqual(['TG1'])
  })

  it('is a no-op when the audit log already carries entries', async () => {
    const repo = canonicalRepo()
    repo.sheets.set('tags', [
      [...SHEET_HEADERS.tags],
      ['TG1', 'urgent', '2024-01-01', '', ''],
    ])
    const existing = [
      [...SHEET_HEADERS.audit_log],
      [
        'AL1',
        NOW,
        'migration',
        'tag',
        'TG1',
        'migration',
        '',
        '{}',
        '',
        '',
        '',
      ],
    ]
    repo.sheets.set(
      'audit_log',
      existing.map((row) => [...row])
    )
    const replaceSpy = vi.spyOn(repo, 'replaceSheetMatrix')
    await makeStep().migrate(contextFor(repo), new RecordingReporter())
    expect(replaceSpy).not.toHaveBeenCalled()
    expect(repo.sheets.get('audit_log')).toEqual(existing)
  })
})
