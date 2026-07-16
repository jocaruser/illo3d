import { describe, expect, it, vi } from 'vitest'
import { SHEET_HEADERS } from '@/Config/schema'
import { ExtendInventoryStep } from '@/Migration/Plan/V2ToV3/ExtendInventoryStep'
import { ExtendJobsStep } from '@/Migration/Plan/V2ToV3/ExtendJobsStep'
import {
  contextFor,
  InMemoryWorkbookRepository,
  RecordingReporter,
} from '../../helpers'

/** The v2 header: canonical minus the single v3 column appended at the end. */
const v2JobsHeader = SHEET_HEADERS.jobs.slice(0, -1)
const v2InventoryHeader = SHEET_HEADERS.inventory.slice(0, -1)

describe('ExtendJobsStep', () => {
  it('appends due_date to a v2 jobs sheet and reports its key', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.sheets.set('jobs', [
      [...v2JobsHeader],
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-01', '', ''],
    ])
    const report = new RecordingReporter()
    await new ExtendJobsStep().migrate(contextFor(repo), report)
    expect(report.keys).toEqual(['wizard.migrationStepJobsDueDate'])
    expect(repo.sheets.get('jobs')).toEqual([
      [...SHEET_HEADERS.jobs],
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-01', '', '', ''],
    ])
  })

  it('is idempotent on an already-canonical jobs sheet', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.sheets.set('jobs', [[...SHEET_HEADERS.jobs]])
    const replaceSpy = vi.spyOn(repo, 'replaceSheetMatrix')
    await new ExtendJobsStep().migrate(
      contextFor(repo),
      new RecordingReporter()
    )
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  it('has the jobs step id', () => {
    expect(new ExtendJobsStep().id).toBe('jobs')
  })
})

describe('ExtendInventoryStep', () => {
  it('appends colour to a v2 inventory sheet and reports its key', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.sheets.set('inventory', [
      [...v2InventoryHeader],
      [
        'INV1',
        'filament',
        'PLA Red',
        '900',
        '500',
        '250',
        '100',
        '2024-01-01',
        '',
        '',
      ],
    ])
    const report = new RecordingReporter()
    await new ExtendInventoryStep().migrate(contextFor(repo), report)
    expect(report.keys).toEqual(['wizard.migrationStepInventoryColour'])
    expect(repo.sheets.get('inventory')).toEqual([
      [...SHEET_HEADERS.inventory],
      [
        'INV1',
        'filament',
        'PLA Red',
        '900',
        '500',
        '250',
        '100',
        '2024-01-01',
        '',
        '',
        '',
      ],
    ])
  })

  it('is idempotent on an already-canonical inventory sheet', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.sheets.set('inventory', [[...SHEET_HEADERS.inventory]])
    const replaceSpy = vi.spyOn(repo, 'replaceSheetMatrix')
    await new ExtendInventoryStep().migrate(
      contextFor(repo),
      new RecordingReporter()
    )
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  it('has the inventory step id', () => {
    expect(new ExtendInventoryStep().id).toBe('inventory')
  })
})
