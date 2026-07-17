import { saveSheetStatus } from '@/Component/save/saveSheetStatus'

describe('saveSheetStatus', () => {
  it('reads the diff while no run is on screen', () => {
    expect(saveSheetStatus('clients', true, null)).toBe('changed')
    expect(saveSheetStatus('clients', false, null)).toBe('clean')
  })

  it('marks written and failed sheets during a run', () => {
    const run = { doneSheets: ['clients'], failedSheets: ['jobs'], active: true }
    expect(saveSheetStatus('clients', true, run)).toBe('saved')
    expect(saveSheetStatus('jobs', true, run)).toBe('failed')
    expect(saveSheetStatus('tags', true, run)).toBe('saving')
  })

  it('falls back to the diff for untouched sheets of a finished run', () => {
    const run = { doneSheets: ['clients'], failedSheets: ['jobs'], active: false }
    expect(saveSheetStatus('clients', false, run)).toBe('saved')
    expect(saveSheetStatus('jobs', true, run)).toBe('failed')
    expect(saveSheetStatus('tags', true, run)).toBe('changed')
    expect(saveSheetStatus('lots', false, run)).toBe('clean')
  })
})
