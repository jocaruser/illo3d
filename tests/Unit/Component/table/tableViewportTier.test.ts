import { tableViewportTierClass } from '@/Component/table/tableViewportTier'

describe('tableViewportTierClass', () => {
  it('returns no hide classes for always', () => {
    expect(tableViewportTierClass('always')).toBe('')
  })

  it('maps small to sm breakpoint visibility', () => {
    expect(tableViewportTierClass('small')).toBe('hidden sm:table-cell')
  })

  it('maps medium to md breakpoint visibility', () => {
    expect(tableViewportTierClass('medium')).toBe('hidden md:table-cell')
  })

  it('maps wide to lg breakpoint visibility', () => {
    expect(tableViewportTierClass('wide')).toBe('hidden lg:table-cell')
  })
})
