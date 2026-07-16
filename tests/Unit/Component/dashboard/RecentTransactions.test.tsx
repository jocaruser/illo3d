import { screen, within } from '@testing-library/react'
import { RecentTransactions } from '@/Component/dashboard/RecentTransactions'
import { renderWithProviders } from '../helpers/renderWithProviders'
import { seedLot, seedTransaction, setupShop } from './harness'
import type { TestContext } from '../../Service/helpers'

vi.mock('@/Hook/useEntityManager', async () => {
  const harness = await import('./harness')
  return { useEntityManager: () => harness.currentEm() }
})

let context: TestContext

function rows(): HTMLElement[] {
  return screen.getAllByRole('listitem')
}

describe('RecentTransactions', () => {
  beforeEach(() => {
    context = setupShop()
  })

  it('says so when the ledger is empty', () => {
    renderWithProviders(<RecentTransactions />)

    expect(screen.getByText('No entries yet.')).toBeInTheDocument()
  })

  it('links to the whole ledger', () => {
    renderWithProviders(<RecentTransactions />)

    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/transactions')
  })

  it('shows the five most recent, newest first', () => {
    for (const day of ['01', '02', '03', '04', '05', '06']) {
      seedTransaction(context.tabs, {
        id: `T${day}`,
        date: `2026-07-${day}`,
        concept: `Day ${day}`,
        amount: '-10',
      })
    }

    renderWithProviders(<RecentTransactions />)

    expect(rows()).toHaveLength(5)
    expect(rows().map((row) => row.textContent?.slice(0, 6))).toEqual([
      'Day 06',
      'Day 05',
      'Day 04',
      'Day 03',
      'Day 02',
    ])
  })

  it('breaks same-day ties by id so the list never jitters', () => {
    seedTransaction(context.tabs, { id: 'T1', date: '2026-07-01', concept: 'First', amount: '-1' })
    seedTransaction(context.tabs, { id: 'T2', date: '2026-07-01', concept: 'Second', amount: '-2' })

    renderWithProviders(<RecentTransactions />)

    expect(rows()[0]).toHaveTextContent('Second')
  })

  it('excludes archived and deleted rows', () => {
    seedTransaction(context.tabs, {
      id: 'T1',
      date: '2026-07-01',
      concept: 'Gone',
      amount: '-1',
      archived: 'true',
    })
    seedTransaction(context.tabs, {
      id: 'T2',
      date: '2026-07-02',
      concept: 'Also gone',
      amount: '-2',
      deleted: 'true',
    })

    renderWithProviders(<RecentTransactions />)

    expect(screen.getByText('No entries yet.')).toBeInTheDocument()
  })

  it('colors income and expense amounts', () => {
    seedTransaction(context.tabs, {
      id: 'T1',
      date: '2026-07-02',
      type: 'income',
      concept: 'Paid job',
      amount: '100',
    })
    seedTransaction(context.tabs, { id: 'T2', date: '2026-07-01', concept: 'Filament', amount: '-40' })

    renderWithProviders(<RecentTransactions />)

    expect(screen.getByText('€100.00')).toHaveClass('text-success')
    expect(screen.getByText('-€40.00')).toHaveClass('text-danger')
  })

  it('shows a dash-less zero for a row with no amount', () => {
    seedTransaction(context.tabs, { id: 'T1', date: '2026-07-01', concept: 'Unknown' })

    renderWithProviders(<RecentTransactions />)

    expect(screen.getByText('€0.00')).toBeInTheDocument()
  })

  describe('concept links', () => {
    it('sends a job-backed row to the job', () => {
      seedTransaction(context.tabs, {
        id: 'T1',
        date: '2026-07-01',
        type: 'income',
        concept: 'Vase',
        amount: '100',
        ref_type: 'job',
        ref_id: 'J1',
      })

      renderWithProviders(<RecentTransactions />)

      expect(within(rows()[0]).getByRole('link', { name: 'Vase' })).toHaveAttribute(
        'href',
        '/jobs/J1'
      )
    })

    it('sends an expense with purchase lots to the transaction detail', () => {
      seedTransaction(context.tabs, {
        id: 'T1',
        date: '2026-07-01',
        concept: 'Filament',
        amount: '-40',
      })
      seedLot(context.tabs, {
        id: 'L1',
        inventory_id: 'INV1',
        transaction_id: 'T1',
        quantity: '1000',
        amount: '40',
      })

      renderWithProviders(<RecentTransactions />)

      expect(within(rows()[0]).getByRole('link', { name: 'Filament' })).toHaveAttribute(
        'href',
        '/transactions/T1'
      )
    })

    it('leaves an expense without lots as plain text', () => {
      seedTransaction(context.tabs, {
        id: 'T1',
        date: '2026-07-01',
        concept: 'Electricity',
        amount: '-40',
      })

      renderWithProviders(<RecentTransactions />)

      expect(within(rows()[0]).queryByRole('link')).not.toBeInTheDocument()
      expect(rows()[0]).toHaveTextContent('Electricity')
    })

    it('leaves an expense whose only lot is archived as plain text', () => {
      seedTransaction(context.tabs, {
        id: 'T1',
        date: '2026-07-01',
        concept: 'Filament',
        amount: '-40',
      })
      seedLot(context.tabs, {
        id: 'L1',
        inventory_id: 'INV1',
        transaction_id: 'T1',
        quantity: '1000',
        amount: '40',
        archived: 'true',
      })

      renderWithProviders(<RecentTransactions />)

      expect(within(rows()[0]).queryByRole('link')).not.toBeInTheDocument()
    })

    it('leaves an income without a job reference as plain text', () => {
      seedTransaction(context.tabs, {
        id: 'T1',
        date: '2026-07-01',
        type: 'income',
        concept: 'Gift',
        amount: '20',
      })

      renderWithProviders(<RecentTransactions />)

      expect(within(rows()[0]).queryByRole('link')).not.toBeInTheDocument()
    })
  })
})
