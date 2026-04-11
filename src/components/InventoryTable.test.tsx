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
            expense_id: 'E11',
            type: 'filament',
            name: 'PLA White',
            qty_initial: 1000,
            qty_current: 1000,
            created_at: '2025-03-25T12:00:00.000Z',
          },
        ]}
      />
    )

    expect(screen.getByText('inventory.name')).toBeInTheDocument()
    expect(screen.getByText('inventory.typeLabel')).toBeInTheDocument()
    expect(screen.getByText('PLA White')).toBeInTheDocument()
    expect(screen.getByText('inventory.type.filament')).toBeInTheDocument()
    expect(screen.getAllByText('1000')).toHaveLength(2)
    expect(screen.getByText('2025-03-25')).toBeInTheDocument()
  })

  it('does not render edit or delete controls', () => {
    render(
      <InventoryTable
        items={[
          {
            id: 'INV1',
            expense_id: 'E1',
            type: 'equipment',
            name: 'Printer',
            qty_initial: 1,
            qty_current: 1,
            created_at: '2025-01-01T00:00:00.000Z',
          },
        ]}
      />
    )

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /delete|remove/i })
    ).not.toBeInTheDocument()
  })
})
