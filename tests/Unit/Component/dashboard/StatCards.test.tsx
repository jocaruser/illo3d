import { screen, within } from '@testing-library/react'
import { StatCards } from '@/Component/dashboard/StatCards'
import { renderWithProviders } from '../helpers/renderWithProviders'
import { seedJob, seedPiece, seedTransaction, setupShop } from './harness'
import type { TestContext } from '../../Service/helpers'

vi.mock('@/Hook/useEntityManager', async () => {
  const harness = await import('./harness')
  return { useEntityManager: () => harness.currentEm() }
})

let context: TestContext

function statValue(label: string): HTMLElement {
  const node = screen.getByText(label).parentElement
  if (node === null) throw new Error(`no card for ${label}`)
  return node
}

describe('StatCards', () => {
  beforeEach(() => {
    context = setupShop()
  })

  it('shows zeroes for a brand new shop', () => {
    renderWithProviders(<StatCards />)

    expect(statValue('Balance')).toHaveTextContent('€0.00')
    expect(statValue('Active jobs')).toHaveTextContent('0')
    expect(statValue('Revenue this month')).toHaveTextContent('€0.00')
    expect(statValue('Pieces completed (7 days)')).toHaveTextContent('0')
  })

  describe('balance', () => {
    it('sums active transactions and links to the ledger', () => {
      seedTransaction(context.tabs, {
        id: 'T1',
        date: '2026-07-01',
        type: 'income',
        amount: '100',
      })
      seedTransaction(context.tabs, { id: 'T2', date: '2026-07-02', amount: '-40' })

      renderWithProviders(<StatCards />)

      expect(screen.getByRole('link', { name: /Balance/ })).toHaveAttribute(
        'href',
        '/transactions'
      )
      expect(screen.getByText('€60.00')).toHaveClass('text-success')
    })

    it('excludes archived and deleted rows', () => {
      seedTransaction(context.tabs, {
        id: 'T1',
        date: '2026-07-01',
        type: 'income',
        amount: '100',
      })
      seedTransaction(context.tabs, {
        id: 'T2',
        date: '2026-07-01',
        type: 'income',
        amount: '500',
        archived: 'true',
      })
      seedTransaction(context.tabs, {
        id: 'T3',
        date: '2026-07-01',
        type: 'income',
        amount: '900',
        deleted: 'true',
      })

      renderWithProviders(<StatCards />)

      expect(statValue('Balance')).toHaveTextContent('€100.00')
    })

    it('tints a negative balance red', () => {
      seedTransaction(context.tabs, { id: 'T1', date: '2026-07-01', amount: '-40' })

      renderWithProviders(<StatCards />)

      expect(screen.getByText('-€40.00')).toHaveClass('text-danger')
    })

    it('leaves a zero balance neutral', () => {
      seedTransaction(context.tabs, { id: 'T1', date: '2026-07-01', amount: '0' })

      renderWithProviders(<StatCards />)

      expect(within(statValue('Balance')).getByText('€0.00')).toHaveClass('text-text')
    })
  })

  it('counts only open, active jobs', () => {
    seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Draft' })
    seedJob(context.tabs, { id: 'J2', client_id: 'CL1', description: 'Open', status: 'in_progress' })
    seedJob(context.tabs, { id: 'J3', client_id: 'CL1', description: 'Done', status: 'paid' })
    seedJob(context.tabs, {
      id: 'J4',
      client_id: 'CL1',
      description: 'Archived',
      archived: 'true',
    })

    renderWithProviders(<StatCards />)

    expect(statValue('Active jobs')).toHaveTextContent('2')
  })

  it('sums income dated in the clock month only', () => {
    seedTransaction(context.tabs, { id: 'T1', date: '2026-07-02', type: 'income', amount: '100' })
    seedTransaction(context.tabs, { id: 'T2', date: '2026-06-30', type: 'income', amount: '900' })
    seedTransaction(context.tabs, { id: 'T3', date: '2026-07-03', amount: '-50' })

    renderWithProviders(<StatCards />)

    expect(statValue('Revenue this month')).toHaveTextContent('€100.00')
  })

  it('counts pieces finished in the last seven days', () => {
    seedPiece(context.tabs, {
      id: 'P1',
      job_id: 'J1',
      name: 'Recent',
      status: 'done',
      created_at: '2026-07-14T12:00:00.000Z',
    })
    seedPiece(context.tabs, {
      id: 'P2',
      job_id: 'J1',
      name: 'Old',
      status: 'done',
      created_at: '2026-07-01T12:00:00.000Z',
    })
    seedPiece(context.tabs, {
      id: 'P3',
      job_id: 'J1',
      name: 'Pending',
      created_at: '2026-07-14T12:00:00.000Z',
    })

    renderWithProviders(<StatCards />)

    expect(statValue('Pieces completed (7 days)')).toHaveTextContent('1')
  })
})
