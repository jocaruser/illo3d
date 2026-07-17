import { screen, within } from '@testing-library/react'
import { ClientActivityTimeline } from '@/Component/detail/ClientActivityTimeline'
import type { EntityManager } from '@/Repository/EntityManager'
import { createWorld, renderWithProviders, type TestWorld } from './helpers/renderDetail'

let world: TestWorld

vi.mock('@/Hook/useEntityManager', () => ({
  useEntityManager: (): EntityManager => world.em,
}))

function seedWorld(): TestWorld {
  return createWorld({
    clients: [{ id: 'CL1', name: 'Acme Corp', created_at: '2024-01-01' }],
    jobs: [
      { id: 'J1', client_id: 'CL1', description: 'Phone case', status: 'paid', created_at: '2024-05-01T09:00:00.000Z' },
      { id: 'J2', client_id: 'CL1', description: '', status: 'draft', created_at: '2024-05-02T09:00:00.000Z' },
    ],
    crm_notes: [
      { id: 'CN1', entity_type: 'client', entity_id: 'CL1', body: 'called about @J1', severity: 'info', created_at: '2024-05-03T09:00:00.000Z' },
      { id: 'JN1', entity_type: 'job', entity_id: 'J1', body: 'printed @P1 not @P99 overnight', severity: 'warning', created_at: '2024-05-04T09:00:00.000Z' },
    ],
    transactions: [
      { id: 'T1', date: '2024-05-05', type: 'income', amount: '42', category: 'job', concept: 'Phone case', ref_type: 'job', ref_id: 'J1', client_id: 'CL1' },
      { id: 'T2', date: '2024-05-06', type: 'income', amount: '10', category: 'other', concept: '', ref_type: '', ref_id: '', client_id: 'CL1' },
    ],
    tags: [{ id: 'TG1', name: 'Vip', created_at: '2024-01-01T00:00:00.000Z' }],
    tag_links: [
      { id: 'TL1', tag_id: 'TG1', entity_type: 'client', entity_id: 'CL1', created_at: '2024-05-07T09:00:00.000Z' },
    ],
    pieces: [{ id: 'P1', job_id: 'J1', name: 'Shell', status: 'done', created_at: '2024-01-01T00:00:00.000Z' }],
  })
}

beforeEach(() => {
  world = seedWorld()
})

function rowIds(): string[] {
  return screen
    .getAllByRole('listitem')
    .map((row) => row.getAttribute('data-testid') ?? '')
}

describe('ClientActivityTimeline', () => {
  it('merges every activity kind newest first', () => {
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)

    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument()
    expect(rowIds()).toEqual([
      'client-activity-row-tag-TL1',
      'client-activity-row-income-T2',
      'client-activity-row-income-T1',
      'client-activity-row-job_note-JN1',
      'client-activity-row-client_note-CN1',
      'client-activity-row-job_created-J2',
      'client-activity-row-job_created-J1',
    ])
  })

  it('shows the empty state for a client with no activity', () => {
    renderWithProviders(<ClientActivityTimeline clientId="CL9" />)
    expect(screen.getByText('No activity yet.')).toBeInTheDocument()
  })

  it('links an income row through to the job that generated it', () => {
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)

    const row = screen.getByTestId('client-activity-row-income-T1')
    expect(within(row).getByText('€42.00')).toBeInTheDocument()
    expect(within(row).getByTestId('transaction-concept-job-link-T1')).toHaveAttribute(
      'href',
      '/jobs/J1'
    )
  })

  it('falls back to a plain income label without a job reference', () => {
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)

    const row = screen.getByTestId('client-activity-row-income-T2')
    expect(within(row).queryByRole('link')).not.toBeInTheDocument()
    expect(row).toHaveTextContent('Income')
  })

  it('shows a plain label when the referenced job row is gone', () => {
    world.em.transactions.remove('T1')
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)
    expect(screen.queryByTestId('client-activity-row-income-T1')).not.toBeInTheDocument()
  })

  it('linkifies mentions inside client and job notes', () => {
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)

    const clientNote = screen.getByTestId('client-activity-row-client_note-CN1')
    expect(within(clientNote).getByRole('link', { name: '@J1' })).toHaveAttribute('href', '/jobs/J1')

    const jobNote = screen.getByTestId('client-activity-row-job_note-JN1')
    expect(within(jobNote).getByRole('link', { name: '@P1' })).toHaveAttribute(
      'href',
      '/jobs/J1#piece-P1'
    )
    expect(within(jobNote).getByRole('link', { name: 'Job: Phone case' })).toBeInTheDocument()
    // @P99 has no piece row, so it stays plain text.
    expect(within(jobNote).queryByRole('link', { name: '@P99' })).not.toBeInTheDocument()
    expect(jobNote).toHaveTextContent('@P99')
  })

  it('shows a job-created row with its status and link', () => {
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)

    const row = screen.getByTestId('client-activity-row-job_created-J1')
    expect(within(row).getByRole('link', { name: 'Job: Phone case' })).toHaveAttribute(
      'href',
      '/jobs/J1'
    )
    expect(row).toHaveTextContent('Status: Paid')
  })

  it('labels a described-less job by its id', () => {
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)
    expect(screen.getByRole('link', { name: 'Job: J2' })).toBeInTheDocument()
  })

  it('shows the tag name on a tag row', () => {
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)
    expect(screen.getByTestId('client-activity-row-tag-TL1')).toHaveTextContent('Vip')
  })

  it('recomputes when the revision changes', () => {
    const { rerender } = renderWithProviders(<ClientActivityTimeline clientId="CL1" revision={0} />)
    expect(screen.queryByTestId('client-activity-row-tag-TL1')).toBeInTheDocument()

    world.em.tagLinks.remove('TL1')
    rerender(<ClientActivityTimeline clientId="CL1" revision={1} />)
    expect(screen.queryByTestId('client-activity-row-tag-TL1')).not.toBeInTheDocument()
  })

  it('omits the timestamp for an undated entry', () => {
    world = createWorld({
      crm_notes: [
        { id: 'CN1', entity_type: 'client', entity_id: 'CL1', body: 'undated', severity: 'info', created_at: '' },
      ],
    })
    renderWithProviders(<ClientActivityTimeline clientId="CL1" />)

    expect(screen.getByTestId('client-activity-row-client_note-CN1')).toBeInTheDocument()
    expect(screen.queryByRole('time')).not.toBeInTheDocument()
  })
})
