import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ExpensesTable } from './ExpensesTable'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('ExpensesTable', () => {
  it('renders inventory link when expense has linked inventory', () => {
    const map = new Map<string, string>()
    map.set('E11', 'INV1')
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <MemoryRouter>
        <ExpensesTable
          expenses={[
            {
              id: 'E11',
              date: '2025-03-25',
              category: 'filament',
              amount: 29.99,
              notes: 'PLA White',
            },
          ]}
          inventoryByExpenseId={map}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MemoryRouter>
    )

    const link = screen.getByTestId('expense-inventory-link-E11')
    expect(link).toHaveAttribute('href', '/inventory')
    expect(link).toHaveTextContent('PLA White')
  })

  it('does not render inventory link when no linked inventory', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <MemoryRouter>
        <ExpensesTable
          expenses={[
            {
              id: 'E99',
              date: '2025-03-25',
              category: 'other',
              amount: 10,
            },
          ]}
          inventoryByExpenseId={new Map()}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MemoryRouter>
    )

    expect(screen.queryByTestId('expense-inventory-link-E99')).not.toBeInTheDocument()
  })
})
