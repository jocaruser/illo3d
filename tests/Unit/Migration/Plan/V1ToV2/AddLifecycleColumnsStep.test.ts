import { describe, expect, it, vi } from 'vitest'
import { SHEET_HEADERS } from '@/Config/schema'
import { AddLifecycleColumnsStep } from '@/Migration/Plan/V1ToV2/AddLifecycleColumnsStep'
import {
  contextFor,
  InMemoryWorkbookRepository,
  RecordingReporter,
  v1Header,
} from '../../helpers'

describe('AddLifecycleColumnsStep', () => {
  it('uses the sheet name as its step id', () => {
    expect(new AddLifecycleColumnsStep('clients').id).toBe('clients')
  })

  it('reports its description key', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.sheets.set('tags', [[...SHEET_HEADERS.tags]])
    const report = new RecordingReporter()
    await new AddLifecycleColumnsStep('tags').migrate(contextFor(repo), report)
    expect(report.keys).toEqual(['wizard.migrationStepColumns'])
  })

  it('extends a v1 sheet to the full canonical (v3) header', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.sheets.set('jobs', [
      v1Header('jobs'),
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-01'],
    ])
    await new AddLifecycleColumnsStep('jobs').migrate(
      contextFor(repo),
      new RecordingReporter()
    )
    // Deliberate: v1→v2 extends straight to v3 canonical, so `due_date` is
    // added here and the V2ToV3 step becomes a no-op on chained runs.
    expect(repo.sheets.get('jobs')).toEqual([
      [...SHEET_HEADERS.jobs],
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-01', '', '', ''],
    ])
  })

  it('skips sheets that already carry the canonical header', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.sheets.set('clients', [
      [...SHEET_HEADERS.clients],
      Array(SHEET_HEADERS.clients.length).fill('x'),
    ])
    const replaceSpy = vi.spyOn(repo, 'replaceSheetMatrix')
    await new AddLifecycleColumnsStep('clients').migrate(
      contextFor(repo),
      new RecordingReporter()
    )
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  it('fails via execute when a stored column violates the prefix invariant', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.sheets.set('clients', [
      ['id', 'full_name'],
      ['CL1', 'Ana'],
    ])
    const result = await new AddLifecycleColumnsStep('clients').execute(
      contextFor(repo),
      new RecordingReporter()
    )
    expect(result.status).toBe('failed')
    expect(result).toMatchObject({
      error: expect.stringContaining('full_name'),
    })
    expect(repo.sheets.get('clients')).toEqual([
      ['id', 'full_name'],
      ['CL1', 'Ana'],
    ])
  })
})
