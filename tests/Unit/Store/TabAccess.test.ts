import { beforeEach, describe, expect, it } from 'vitest'
import { workbookTabAccess } from '@/Store/TabAccess'
import { useWorkbookStore } from '@/Store/workbookStore'

beforeEach(() => {
  useWorkbookStore.getState().reset()
})

describe('workbookTabAccess', () => {
  it('reads tabs from the live workbook store', () => {
    const tabs = workbookTabAccess()
    expect(tabs.getTab('tags')).toBe(useWorkbookStore.getState().tabs.tags)
  })

  it('mutates through the store and marks it dirty', () => {
    const tabs = workbookTabAccess()
    tabs.mutateTab('tags', (matrix) => [...matrix, ['TG1', 'Vip', '', '', '']])
    expect(useWorkbookStore.getState().tabs.tags).toHaveLength(2)
    expect(useWorkbookStore.getState().dirty).toBe(true)
    expect(tabs.getTab('tags')).toHaveLength(2)
  })
})
