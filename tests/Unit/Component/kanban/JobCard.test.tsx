import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobCard, type KanbanCard } from '@/Component/kanban/JobCard'
import { Job } from '@/Entity/Job'
import type { DueDateBand } from '@/Service/Pricing/dueDate'
import { makeDataTransfer } from '../dashboard/harness'
import { renderWithProviders } from '../helpers/renderWithProviders'

function makeCard(overrides: Partial<KanbanCard> = {}): KanbanCard {
  const job = Job.fromRecord({
    id: 'J1',
    client_id: 'CL1',
    description: 'Vase',
    status: 'draft',
    created_at: '2026-07-16T10:00:00.000Z',
    due_date: '2026-07-16',
  })
  return {
    job,
    clientName: 'Acme',
    pricing: { complete: true, total: 30 },
    benefit: null,
    piecesDone: 0,
    piecesTotal: 0,
    dueBand: 'none',
    dueDay: '2026-07-16',
    ...overrides,
  }
}

describe('JobCard', () => {
  it('shows the description, client, total and due date', () => {
    renderWithProviders(<JobCard card={makeCard()} onStatusChange={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Vase' })).toHaveAttribute('href', '/jobs/J1')
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('€30.00')).toBeInTheDocument()
    expect(screen.getByText('Due 2026-07-16')).toBeInTheDocument()
  })

  it('flags incomplete pricing instead of showing a misleading total', () => {
    renderWithProviders(
      <JobCard card={makeCard({ pricing: { complete: false } })} onStatusChange={vi.fn()} />
    )

    expect(screen.getByText('Incomplete pricing')).toHaveClass('text-warning')
    expect(screen.queryByText('€30.00')).not.toBeInTheDocument()
  })

  it('shows the benefit in parentheses when it is computable', () => {
    renderWithProviders(<JobCard card={makeCard({ benefit: 12.5 })} onStatusChange={vi.fn()} />)

    expect(screen.getByText('(€12.50)')).toBeInTheDocument()
  })

  it('shows piece progress — the hybrid the piece-board retrospective asked for', () => {
    renderWithProviders(
      <JobCard card={makeCard({ piecesDone: 3, piecesTotal: 5 })} onStatusChange={vi.fn()} />
    )

    expect(screen.getByText('3/5 pieces done')).toBeInTheDocument()
  })

  it('omits piece progress for a job with no pieces', () => {
    renderWithProviders(<JobCard card={makeCard()} onStatusChange={vi.fn()} />)

    expect(screen.queryByText(/pieces done/)).not.toBeInTheDocument()
  })

  it.each([
    ['red', 'text-danger'],
    ['orange', 'text-warning'],
    ['yellow', 'text-warning'],
    ['none', 'text-text-muted'],
  ] as Array<[DueDateBand, string]>)('colors the %s due band', (dueBand, expected) => {
    renderWithProviders(<JobCard card={makeCard({ dueBand })} onStatusChange={vi.fn()} />)

    expect(screen.getByText('Due 2026-07-16')).toHaveClass(expected)
  })

  it('offers a labelled but visually hidden status select for keyboard users', async () => {
    const onStatusChange = vi.fn()
    renderWithProviders(<JobCard card={makeCard()} onStatusChange={onStatusChange} />)

    const select = screen.getByLabelText('Status for job J1')
    expect(select).toHaveClass('sr-only')
    expect(select).toHaveValue('draft')

    await userEvent.selectOptions(select, 'delivered')

    expect(onStatusChange).toHaveBeenCalledTimes(1)
    expect(onStatusChange.mock.calls[0][0].id).toBe('J1')
    expect(onStatusChange.mock.calls[0][1]).toBe('delivered')
  })

  it('publishes the job id when the drag starts', () => {
    renderWithProviders(<JobCard card={makeCard()} onStatusChange={vi.fn()} />)
    const dataTransfer = makeDataTransfer()

    fireEvent.dragStart(screen.getByRole('listitem'), { dataTransfer })

    expect(dataTransfer.getData('application/x-illo3d-job-id')).toBe('J1')
  })

  it('does not swallow a plain click on the link', async () => {
    const onStatusChange = vi.fn()
    renderWithProviders(<JobCard card={makeCard()} onStatusChange={onStatusChange} />)

    await userEvent.click(screen.getByRole('link', { name: 'Vase' }))

    expect(onStatusChange).not.toHaveBeenCalled()
  })
})
