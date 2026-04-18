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

  it('returns expense transaction detail trail with resolved concept', () => {
    const items = getBreadcrumbItems(
      '/transactions/T11',
      t,
      undefined,
      undefined,
      undefined,
      () => 'PLA White',
    )
    expect(items).toEqual([
      { label: 'breadcrumb.home', to: '/dashboard' },
      { label: 'nav.transactions', to: '/transactions' },
      { label: 'PLA White' },
    ])
  })

  it('falls back to transaction id when concept missing', () => {
    const items = getBreadcrumbItems('/transactions/T11', t)
    expect(items?.[2]).toEqual({ label: 'T11' })
  })
})
