import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TransactionsTable } from './TransactionsTable'
import type { Transaction, Client } from '@/types/money'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const jobTransaction: Transaction = {
  id: 't001',
  date: '2026-02-28',
  type: 'income',
  amount: 45,
  category: 'job',
  concept: 'Figura dragón',
  ref_type: 'job',
  ref_id: 'j001',
  client_id: 'c001',
}

const expenseTransaction: Transaction = {
  id: 't002',
  date: '2026-02-27',
  type: 'expense',
  amount: -25,
  category: 'filament',
  concept: 'PLA Negro',
  ref_type: '',
  ref_id: '',
}

const mockClients: Client[] = [
  { id: 'c001', name: 'Juan Pérez', created_at: '2026-02-01' },
]

describe('TransactionsTable', () => {
  it('renders transactions with data', () => {
    render(
      <MemoryRouter>
        <TransactionsTable
          transactions={[jobTransaction, expenseTransaction]}
          clients={mockClients}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Figura dragón')).toBeInTheDocument()
    expect(screen.getByText('PLA Negro')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('links job-backed concept to job detail', () => {
    render(
      <MemoryRouter>
        <TransactionsTable
          transactions={[jobTransaction]}
          clients={mockClients}
        />
      </MemoryRouter>
    )
    const link = screen.getByTestId('transaction-concept-job-link-t001')
    expect(link).toHaveAttribute('href', '/jobs/j001')
    expect(link).toHaveTextContent('Figura dragón')
  })

  it('links expense concept to inventory when expense has inventory', () => {
    const withLots = new Set<string>(['t002'])
    render(
      <MemoryRouter>
        <TransactionsTable
          transactions={[expenseTransaction]}
          clients={mockClients}
          expenseTxnIdsWithLots={withLots}
        />
      </MemoryRouter>
    )
    const link = screen.getByTestId('transaction-concept-inventory-link-t002')
    expect(link).toHaveAttribute('href', '/inventory')
    expect(link).toHaveTextContent('PLA Negro')
  })

  it('renders plain expense concept when no linked inventory', () => {
    render(
      <MemoryRouter>
        <TransactionsTable
          transactions={[expenseTransaction]}
          clients={mockClients}
        />
      </MemoryRouter>
    )
    expect(
      screen.queryByTestId('transaction-concept-inventory-link-t002')
    ).not.toBeInTheDocument()
    const text = screen.getByText('PLA Negro')
    expect(text.tagName.toLowerCase()).not.toBe('a')
  })

  it('shows income as positive and expense as negative', () => {
    render(
      <MemoryRouter>
        <TransactionsTable
          transactions={[jobTransaction, expenseTransaction]}
          clients={mockClients}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('€45.00')).toBeInTheDocument()
    expect(screen.getByText('-€25.00')).toBeInTheDocument()
  })
})
