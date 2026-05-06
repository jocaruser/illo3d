import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Inventory } from '@/types/money'
import { InventoryAlerts } from './InventoryAlerts'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

function inventory(
  overrides: Partial<Inventory> & Pick<Inventory, 'id' | 'name'>,
): Inventory {
  return {
    type: 'filament',
    qty_current: 0,
    warn_yellow: 0,
    warn_orange: 0,
    warn_red: 0,
    created_at: '2025-01-01',
    ...overrides,
  }
}

describe('InventoryAlerts', () => {
  it('includes yellow-only threshold rows when qty is at or below warn_yellow', () => {
    render(
      <MemoryRouter>
        <InventoryAlerts
          items={[
            inventory({
              id: 'inv1',
              name: 'PLA roll',
              warn_yellow: 100,
              warn_orange: 0,
              warn_red: 0,
              qty_current: 50,
            }),
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /PLA roll/ })).toHaveAttribute(
      'href',
      '/inventory/inv1',
    )
  })
})
