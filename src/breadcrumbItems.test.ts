import { describe, it, expect } from 'vitest'
import { getBreadcrumbItems } from './breadcrumbItems'

const t = ((key: string) => key) as Parameters<typeof getBreadcrumbItems>[1]

describe('getBreadcrumbItems', () => {
  it('returns inventory detail trail with resolved name', () => {
    const items = getBreadcrumbItems(
      '/inventory/INV1',
      t,
      undefined,
      undefined,
      () => 'PLA White'
    )
    expect(items).toEqual([
      { label: 'breadcrumb.home', to: '/dashboard' },
      { label: 'nav.inventory', to: '/inventory' },
      { label: 'PLA White' },
    ])
  })

  it('falls back to id when inventory name missing', () => {
    const items = getBreadcrumbItems('/inventory/INV1', t)
    expect(items?.[2]).toEqual({ label: 'INV1' })
  })
})
