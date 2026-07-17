import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanBoard } from '@/Component/kanban/KanbanBoard'
import {
  makeDataTransfer,
  seedClient,
  seedJob,
  seedPiece,
  seedPricedPiece,
  setShopMetadata,
  setupShop,
} from '../dashboard/harness'
import { renderWithProviders } from '../helpers/renderWithProviders'
import type { TestContext } from '../../Service/helpers'

vi.mock('@/Hook/useEntityManager', async () => {
  const harness = await import('../dashboard/harness')
  return { useEntityManager: () => harness.currentEm() }
})

vi.mock('@/Hook/useShopMetadata', async () => {
  const harness = await import('../dashboard/harness')
  return { useShopMetadata: () => harness.currentMetadata() }
})

let context: TestContext

const COLUMNS = ['Draft', 'In progress', 'Delivered', 'Paid', 'Cancelled']

function column(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

function gapBefore(columnName: string, insertBefore: string): HTMLElement {
  const gaps = within(column(columnName)).getAllByTestId('kanban-drop-gap')
  const gap = gaps.find((node) => node.dataset.insertBefore === insertBefore)
  if (gap === undefined) throw new Error(`no gap before ${insertBefore}`)
  return gap
}

function cardOrder(columnName: string): string[] {
  return within(column(columnName))
    .getAllByRole('listitem')
    .map((node) => node.dataset.jobId ?? '')
}

function statusOf(id: string): string {
  const job = context.em.jobs.find(id)
  if (job === null) throw new Error(`no job ${id}`)
  return job.status
}

describe('KanbanBoard', () => {
  beforeEach(() => {
    context = setupShop()
    seedClient(context.tabs, { id: 'CL1', name: 'Acme' })
  })

  describe('columns', () => {
    it('renders every status column with its localized label', () => {
      renderWithProviders(<KanbanBoard />)

      for (const label of COLUMNS) expect(column(label)).toBeInTheDocument()
    })

    it('places each job in its status column and counts it', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Vase',
        status: 'draft',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'Gear',
        status: 'in_progress',
      })
      seedJob(context.tabs, {
        id: 'J3',
        client_id: 'CL1',
        description: 'Box',
        status: 'delivered',
      })
      seedJob(context.tabs, {
        id: 'J4',
        client_id: 'CL1',
        description: 'Hook',
        status: 'paid',
      })
      seedJob(context.tabs, {
        id: 'J5',
        client_id: 'CL1',
        description: 'Pin',
        status: 'cancelled',
      })

      renderWithProviders(<KanbanBoard />)

      expect(within(column('Draft')).getByText('Vase')).toBeInTheDocument()
      expect(within(column('In progress')).getByText('Gear')).toBeInTheDocument()
      expect(within(column('Delivered')).getByText('Box')).toBeInTheDocument()
      expect(within(column('Paid')).getByText('Hook')).toBeInTheDocument()
      expect(within(column('Cancelled')).getByText('Pin')).toBeInTheDocument()
      expect(within(column('Draft')).getByText('1 job')).toBeInTheDocument()
    })

    it('shows a placeholder and a plural count for an empty column', () => {
      renderWithProviders(<KanbanBoard />)

      expect(within(column('Draft')).getByText('No jobs')).toBeInTheDocument()
      expect(within(column('Draft')).getByText('0 jobs')).toBeInTheDocument()
    })

    it('orders a column by board order', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Second',
        board_order: '2000',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'First',
        board_order: '1000',
      })

      renderWithProviders(<KanbanBoard />)

      expect(cardOrder('Draft')).toEqual(['J2', 'J1'])
    })

    it('excludes archived and soft-deleted jobs', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Archived',
        archived: 'true',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'Deleted',
        deleted: 'true',
      })

      renderWithProviders(<KanbanBoard />)

      expect(screen.queryByText('Archived')).not.toBeInTheDocument()
      expect(screen.queryByText('Deleted')).not.toBeInTheDocument()
    })

    it('falls back to a blank client when the job points at nothing', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL404',
        description: 'Orphan',
      })

      renderWithProviders(<KanbanBoard />)

      expect(within(column('Draft')).getByText('Orphan')).toBeInTheDocument()
      expect(within(column('Draft')).queryByText('Acme')).not.toBeInTheDocument()
    })
  })

  describe('stale completed cards', () => {
    // The clock is 2026-07-16T12:00Z; the default window is 5 days.
    it('keeps a paid card that is exactly at the threshold', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Just in time',
        status: 'paid',
        due_date: '2026-07-11',
      })

      renderWithProviders(<KanbanBoard />)

      expect(screen.getByText('Just in time')).toBeInTheDocument()
    })

    it('hides a paid card one day past the threshold', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Long gone',
        status: 'paid',
        due_date: '2026-07-10',
      })

      renderWithProviders(<KanbanBoard />)

      expect(screen.queryByText('Long gone')).not.toBeInTheDocument()
    })

    it('keeps an open card however old it is', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Ancient draft',
        due_date: '2020-01-01',
      })

      renderWithProviders(<KanbanBoard />)

      expect(screen.getByText('Ancient draft')).toBeInTheDocument()
    })

    it('honours the shop metadata window over the default', () => {
      setShopMetadata({ kanban: { autoCardsHideAfterXDays: 10 } })
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Long gone',
        status: 'paid',
        due_date: '2026-07-10',
      })

      renderWithProviders(<KanbanBoard />)

      expect(screen.getByText('Long gone')).toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    beforeEach(() => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Second',
        board_order: '2000',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'First',
        board_order: '1000',
      })
    })

    it('reorders within a column when dropped on a gap', () => {
      renderWithProviders(<KanbanBoard />)
      const dataTransfer = makeDataTransfer()

      fireEvent.dragStart(within(column('Draft')).getAllByRole('listitem')[1], {
        dataTransfer,
      })
      fireEvent.dragOver(gapBefore('Draft', 'J2'), { dataTransfer })
      fireEvent.drop(gapBefore('Draft', 'J2'), { dataTransfer })

      expect(cardOrder('Draft')).toEqual(['J1', 'J2'])
    })

    it('highlights the gap being dragged over and clears it on leave', () => {
      renderWithProviders(<KanbanBoard />)
      const dataTransfer = makeDataTransfer('J1')

      fireEvent.dragOver(gapBefore('Draft', 'J2'), { dataTransfer })
      expect(gapBefore('Draft', 'J2')).toHaveClass('bg-primary/60')

      fireEvent.dragLeave(gapBefore('Draft', 'J2'))
      expect(gapBefore('Draft', 'J2')).not.toHaveClass('bg-primary/60')
    })

    it('highlights the trailing gap when hovering the end of a column', () => {
      renderWithProviders(<KanbanBoard />)

      fireEvent.dragOver(gapBefore('Draft', '__end__'), {
        dataTransfer: makeDataTransfer('J1'),
      })

      expect(gapBefore('Draft', '__end__')).toHaveClass('bg-primary/60')
      expect(gapBefore('Draft', 'J2')).not.toHaveClass('bg-primary/60')
    })

    it('moves a card to another column when dropped on the column itself', () => {
      renderWithProviders(<KanbanBoard />)

      fireEvent.drop(column('In progress'), {
        dataTransfer: makeDataTransfer('J1'),
      })

      expect(statusOf('J1')).toBe('in_progress')
      expect(within(column('In progress')).getByText('Second')).toBeInTheDocument()
    })

    it('appends to a column when dropped on its trailing gap', () => {
      renderWithProviders(<KanbanBoard />)

      fireEvent.drop(gapBefore('Draft', '__end__'), {
        dataTransfer: makeDataTransfer('J2'),
      })

      expect(cardOrder('Draft')).toEqual(['J1', 'J2'])
    })

    it('ignores a drop that carries no job id', () => {
      renderWithProviders(<KanbanBoard />)

      fireEvent.drop(column('In progress'), {
        dataTransfer: makeDataTransfer(),
      })

      expect(statusOf('J1')).toBe('draft')
      expect(cardOrder('Draft')).toEqual(['J2', 'J1'])
    })

    it('ignores a drop naming a job that is not on the board', () => {
      renderWithProviders(<KanbanBoard />)

      fireEvent.drop(column('In progress'), {
        dataTransfer: makeDataTransfer('J404'),
      })

      expect(within(column('In progress')).getByText('No jobs')).toBeInTheDocument()
    })

    it('routes a drop into paid through the confirmation dialog', async () => {
      seedPricedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })
      renderWithProviders(<KanbanBoard />)

      fireEvent.drop(column('Paid'), { dataTransfer: makeDataTransfer('J1') })

      expect(screen.getByRole('dialog')).toHaveTextContent('€30.00')
      expect(statusOf('J1')).toBe('draft')

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(statusOf('J1')).toBe('paid')
      expect(within(column('Paid')).getByText('Second')).toBeInTheDocument()
    })

    it('blocks a drop into paid when pricing is incomplete', () => {
      seedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })
      renderWithProviders(<KanbanBoard />)

      fireEvent.drop(column('Paid'), { dataTransfer: makeDataTransfer('J1') })

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Set a per-unit price and a units count on every piece'
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(statusOf('J1')).toBe('draft')
    })
  })

  describe('keyboard status changes', () => {
    beforeEach(() => {
      seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Vase' })
    })

    it('commits a no-dialog transition from the card select', async () => {
      renderWithProviders(<KanbanBoard />)

      await userEvent.selectOptions(screen.getByLabelText('Status for job J1'), 'in_progress')

      expect(statusOf('J1')).toBe('in_progress')
      expect(within(column('In progress')).getByText('Vase')).toBeInTheDocument()
    })

    it('routes a select into cancelled through the same dialog flow', async () => {
      seedPricedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })
      renderWithProviders(<KanbanBoard />)

      await userEvent.selectOptions(screen.getByLabelText('Status for job J1'), 'cancelled')

      expect(screen.getByRole('dialog')).toHaveTextContent('Mark this job as cancelled?')
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(statusOf('J1')).toBe('cancelled')
    })
  })

  it('shows piece progress and the benefit on a card', () => {
    seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Vase' })
    seedPricedPiece(context.tabs, {
      id: 'P1',
      job_id: 'J1',
      name: 'Body',
      status: 'done',
    })
    seedPiece(context.tabs, {
      id: 'P2',
      job_id: 'J1',
      name: 'Lid',
      price: '5',
      units: '1',
    })

    renderWithProviders(<KanbanBoard />)

    expect(screen.getByText('1/2 pieces done')).toBeInTheDocument()
    expect(screen.getByText('€35.00')).toBeInTheDocument()
  })
})
