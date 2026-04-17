import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InventoryTable } from './InventoryTable'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('InventoryTable', () => {
  it('renders column headers and inventory rows', () => {
    render(
      <InventoryTable
        items={[
          {
            id: 'INV1',
            type: 'filament',
            name: 'PLA White',
            qty_current: 1000,
            warn_yellow: 0,
            warn_orange: 0,
            warn_red: 0,
            created_at: '2025-03-25T12:00:00.000Z',
          },
        ]}
        lots={[
          {
            id: 'L1',
            inventory_id: 'INV1',
            transaction_id: 'T1',
            quantity: 1000,
            amount: 29.99,
            created_at: '2025-03-25T12:00:00.000Z',
          },
        ]}
      />
    )

    expect(screen.getByText('inventory.name')).toBeInTheDocument()
    expect(screen.getByText('inventory.typeLabel')).toBeInTheDocument()
    expect(screen.getByText('inventory.avgUnitCost')).toBeInTheDocument()
    expect(screen.getByText('PLA White')).toBeInTheDocument()
    expect(screen.getByText('inventory.type.filament')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('2025-03-25')).toBeInTheDocument()
  })

  it('does not render edit or delete controls', () => {
    render(
      <InventoryTable
        items={[
          {
            id: 'INV1',
            type: 'equipment',
            name: 'Printer',
            qty_current: 1,
            warn_yellow: 0,
            warn_orange: 0,
            warn_red: 0,
            created_at: '2025-01-01T00:00:00.000Z',
          },
        ]}
        lots={[]}
      />
    )

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /delete|remove/i })
    ).not.toBeInTheDocument()
  })
})
