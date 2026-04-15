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

const mockTransactions: Transaction[] = [
  {
    id: 't001',
    date: '2026-02-28',
    type: 'income',
    amount: 45,
    category: 'job',
    concept: 'Figura dragón',
    ref_type: 'job',
    ref_id: 'j001',
    client_id: 'c001',
  },
  {
    id: 't002',
    date: '2026-02-27',
    type: 'expense',
    amount: -25,
    category: 'filament',
    concept: 'PLA Negro',
    ref_type: 'expense',
    ref_id: 'e001',
  },
]

const mockClients: Client[] = [
  { id: 'c001', name: 'Juan Pérez', created_at: '2026-02-01' },
]

describe('TransactionsTable', () => {
   it('renders transactions with data', () => {
    render(
      <MemoryRouter>
        <TransactionsTable transactions={mockTransactions} clients={mockClients} />
      </MemoryRouter>
    )
    expect(screen.getByText('Figura dragón')).toBeInTheDocument()
    expect(screen.getByText('PLA Negro')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('shows income as positive and expense as negative', () => {
    render(
      <MemoryRouter>
        <TransactionsTable transactions={mockTransactions} clients={mockClients} />
      </MemoryRouter>
    )
    expect(screen.getByText('€45.00')).toBeInTheDocument()
    expect(screen.getByText('-€25.00')).toBeInTheDocument()
  })
})
