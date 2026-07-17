import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobsPage } from '@/Controller/JobsPage'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import type { EntityManager } from '@/Repository/EntityManager'
import { createWorld, renderRoute, type TestWorld } from '../Component/detail/helpers/renderDetail'

const { toastMock, metadataMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
  metadataMock: {
    value: { metadata: null as ShopMetadata | null, loading: false, error: null as string | null },
  },
}))

let world: TestWorld

vi.mock('@/Hook/useEntityManager', () => ({
  useEntityManager: (): EntityManager => world.em,
}))
vi.mock('@/Hook/useShopMetadata', () => ({ useShopMetadata: () => metadataMock.value }))
vi.mock('@/Component/Toast', () => ({ toast: toastMock }))

/**
 * J1 priced (€42, in_progress), J2 unpriced (draft), J3 paid, J4 archived.
 * The clock is frozen at 2024-05-20.
 */
function seedWorld(): TestWorld {
  return createWorld({
    clients: [
      { id: 'CL1', name: 'Acme Corp', created_at: '2024-01-01' },
      { id: 'CL2', name: 'Beta LLC', created_at: '2024-01-01' },
    ],
    jobs: [
      { id: 'J1', client_id: 'CL1', description: 'Phone case', status: 'in_progress', created_at: '2024-05-01T09:00:00.000Z', due_date: '2024-05-01' },
      { id: 'J2', client_id: 'CL2', description: 'Bracket', status: 'draft', created_at: '2024-05-02T09:00:00.000Z', due_date: '2024-05-19' },
      { id: 'J3', client_id: 'CL1', description: 'Keychain', status: 'paid', created_at: '2024-05-03T09:00:00.000Z', due_date: '2024-05-16' },
      { id: 'J4', client_id: 'CL1', description: 'Archived job', status: 'draft', created_at: '2024-05-04T09:00:00.000Z', archived: 'true' },
    ],
    pieces: [
      { id: 'P1', job_id: 'J1', name: 'Shell', status: 'pending', price: '21', units: '2', created_at: '2024-05-01T10:00:00.000Z' },
      { id: 'P2', job_id: 'J2', name: 'Arm', status: 'pending', created_at: '2024-05-02T10:00:00.000Z' },
      { id: 'P3', job_id: 'J3', name: 'Ring', status: 'done', price: '5', units: '3', created_at: '2024-05-03T10:00:00.000Z' },
    ],
    tags: [
      { id: 'TG1', name: 'Vip', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'TG2', name: 'Retired', created_at: '2024-01-01T00:00:00.000Z', archived: 'true' },
    ],
    tag_links: [
      { id: 'TL1', tag_id: 'TG1', entity_type: 'job', entity_id: 'J1', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'TL2', tag_id: 'TG1', entity_type: 'client', entity_id: 'CL1', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'TL3', tag_id: 'TG2', entity_type: 'job', entity_id: 'J2', created_at: '2024-01-01T00:00:00.000Z' },
    ],
  })
}

function renderPage() {
  return renderRoute(<JobsPage />, { path: '/jobs', entry: '/jobs' })
}

function dataRowIds(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '')
}

function statusBox(jobId: string): HTMLElement {
  return within(screen.getByTestId(`job-status-${jobId}`)).getByRole('combobox')
}

beforeEach(() => {
  world = seedWorld()
  metadataMock.value = { metadata: null, loading: false, error: null }
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('JobsPage', () => {
  it('lists active jobs newest first by default', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument()
    expect(dataRowIds()).toEqual(['J3', 'J2', 'J1'])
    expect(screen.queryByTestId('job-detail-link-J4')).not.toBeInTheDocument()
  })

  it('links the id to the job and the client cell to the client', () => {
    renderPage()

    expect(screen.getByTestId('job-detail-link-J1')).toHaveAttribute('href', '/jobs/J1')
    expect(screen.getByTestId('job-client-link-J1')).toHaveAttribute('href', '/clients/CL1')
    expect(screen.getByTestId('job-client-link-J1')).toHaveTextContent('Acme Corp')
  })

  it('falls back to the client id when the client row is missing', () => {
    world.em.clients.remove('CL1')
    renderPage()
    expect(screen.getByTestId('job-client-link-J1')).toHaveTextContent('CL1')
  })

  it('shows the total, or the incomplete badge when a piece is unpriced', () => {
    renderPage()

    const priced = screen.getByTestId('job-detail-link-J1').closest('tr') as HTMLElement
    expect(within(priced).getByText('€42.00')).toBeInTheDocument()

    const unpriced = screen.getByTestId('job-detail-link-J2').closest('tr') as HTMLElement
    expect(within(unpriced).getByText('Incomplete pricing')).toBeInTheDocument()
  })

  it('bands the due date by how late the job runs', () => {
    renderPage()

    // 19 days late.
    const j1 = screen.getByTestId('job-detail-link-J1').closest('tr') as HTMLElement
    expect(within(j1).getByText('2024-05-01')).toHaveAttribute('data-band', 'red')
    expect(within(j1).getByText('2024-05-01')).toHaveAttribute('title', '19 days past due')
    // 1 day late: still inside the calm band, and singular.
    const j2 = screen.getByTestId('job-detail-link-J2').closest('tr') as HTMLElement
    expect(within(j2).getByText('2024-05-19')).toHaveAttribute('data-band', 'none')
    expect(within(j2).getByText('2024-05-19')).toHaveAttribute('title', '1 day past due')
    // 4 days late.
    const j3 = screen.getByTestId('job-detail-link-J3').closest('tr') as HTMLElement
    expect(within(j3).getByText('2024-05-16')).toHaveAttribute('data-band', 'yellow')
  })

  it('calls a job due today on track', () => {
    world.tabs.seed('jobs', [
      { id: 'J9', client_id: 'CL1', description: 'Due today', status: 'draft', created_at: '2024-05-20T09:00:00.000Z', due_date: '2024-05-20' },
    ])
    renderPage()

    const row = screen.getByTestId('job-detail-link-J9').closest('tr') as HTMLElement
    expect(within(row).getByText('2024-05-20')).toHaveAttribute('title', 'On track')
  })

  it('shows a dash when a job has no date at all', () => {
    world.tabs.seed('jobs', [
      { id: 'J9', client_id: 'CL1', description: 'Undated', status: 'draft', created_at: '', due_date: '' },
    ])
    renderPage()

    const row = screen.getByTestId('job-detail-link-J9').closest('tr') as HTMLElement
    expect(within(row).getByText('—')).toBeInTheDocument()
  })

  it('shows the job tag tooltip from both the id and the description', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.hover(screen.getByTestId('job-id-tooltip-J1'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tags: Vip')
    await user.unhover(screen.getByTestId('job-id-tooltip-J1'))

    await user.hover(screen.getByTestId('job-description-tooltip-J1'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tags: Vip')
  })

  it('keeps the description as plain text, not a second link', () => {
    renderPage()
    const cell = screen.getByTestId('job-description-tooltip-J1')
    expect(within(cell).queryByRole('link')).not.toBeInTheDocument()
    expect(cell).toHaveTextContent('Phone case')
  })

  it('ignores a client tag link when tagging a job row', async () => {
    const user = userEvent.setup()
    renderPage()

    // CL1 carries the Vip tag, but J3 itself carries none.
    await user.hover(screen.getByTestId('job-id-tooltip-J3'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('ignores a link to an archived tag', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.hover(screen.getByTestId('job-id-tooltip-J2'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it.each([
    ['ID', ['J1', 'J2', 'J3']],
    ['Description', ['J4', 'J2', 'J3']],
    ['Client', ['J1', 'J3', 'J2']],
    ['Status', ['J2', 'J1', 'J3']],
    ['Due date', ['J1', 'J3', 'J2']],
  ])('sorts by %s ascending', async (column, expected) => {
    const user = userEvent.setup()
    // Sorting by Description needs the archived row out of the way.
    if (column === 'Description') world.em.jobs.remove('J1')
    renderPage()

    await user.click(screen.getByRole('button', { name: `Sort by ${column}` }))
    expect(dataRowIds()).toEqual(expected.filter((id) => id !== 'J4'))
  })

  it('sorts by total, sinking incomplete pricing to the bottom', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Sort by Total' }))
    // J3 = €15, J1 = €42, J2 has no total.
    expect(dataRowIds()).toEqual(['J3', 'J1', 'J2'])

    await user.click(screen.getByRole('button', { name: 'Total, sorted ascending' }))
    expect(dataRowIds()).toEqual(['J1', 'J3', 'J2'])
  })

  it('flips the default created sort to ascending', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Created, sorted descending' }))
    expect(dataRowIds()).toEqual(['J1', 'J2', 'J3'])
  })

  it('fuzzy-filters and shows the no-matches message', async () => {
    const user = userEvent.setup()
    renderPage()

    const search = screen.getByRole('searchbox')
    await user.type(search, 'Bracket')
    expect(dataRowIds()).toEqual(['J2'])

    await user.clear(search)
    await user.type(search, 'zzzznomatch')
    expect(screen.getByText('No rows match your search.')).toBeInTheDocument()
  })

  it('matches a job by client name and by tag', async () => {
    const user = userEvent.setup()
    renderPage()

    const search = screen.getByRole('searchbox')
    await user.type(search, 'Beta')
    expect(dataRowIds()).toEqual(['J2'])

    await user.clear(search)
    await user.type(search, 'Vip')
    expect(dataRowIds()).toEqual(['J1'])
  })

  it('shows the empty-collection message when there is no job', () => {
    world = createWorld({})
    renderPage()
    expect(screen.getByText('No jobs yet.')).toBeInTheDocument()
  })

  it('commits an ungated status change straight away', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(statusBox('J1'))
    await user.click(screen.getByRole('option', { name: 'Delivered' }))

    expect(world.em.jobs.find('J1')?.status).toBe('delivered')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('blocks paid while a counting piece is unpriced', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(statusBox('J2'))
    await user.click(screen.getByRole('option', { name: 'Paid' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Set a per-unit price and a units count on every piece'
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(world.em.jobs.find('J2')?.status).toBe('draft')
  })

  it('confirms paid and books the income transaction', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(statusBox('J1'))
    await user.click(screen.getByRole('option', { name: 'Paid' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Mark job as paid' })).toBeInTheDocument()
    expect(within(dialog).getByText(/€42\.00/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(world.em.jobs.find('J1')?.status).toBe('paid')
    expect(world.em.transactions.findAll()).toHaveLength(1)
    expect(world.em.transactions.find('T1')).toMatchObject({ amount: 42, refId: 'J1' })
  })

  it('skips the income transaction when the box is unchecked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(statusBox('J1'))
    await user.click(screen.getByRole('option', { name: 'Paid' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(world.em.jobs.find('J1')?.status).toBe('paid')
    expect(world.em.transactions.findAll()).toHaveLength(0)
  })

  it('leaves the status untouched when the paid dialog is cancelled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(statusBox('J1'))
    await user.click(screen.getByRole('option', { name: 'Paid' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(world.em.jobs.find('J1')?.status).toBe('in_progress')
  })

  it('warns before leaving the paid status', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(statusBox('J3'))
    await user.click(screen.getByRole('option', { name: 'Delivered' }))

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Change status from paid?' })
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(world.em.jobs.find('J3')?.status).toBe('delivered')
  })

  it('confirms before cancelling a job', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(statusBox('J1'))
    await user.click(screen.getByRole('option', { name: 'Cancelled' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Cancel job' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(world.em.jobs.find('J1')?.status).toBe('cancelled')
  })

  it('archives a job after confirming and cascades to its pieces', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('job-archive-J1'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Archive job J1\?/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Archive' }))

    expect(dataRowIds()).toEqual(['J3', 'J2'])
    expect(world.em.jobs.find('J1')?.isArchived()).toBe(true)
    expect(world.em.pieces.find('P1')?.isArchived()).toBe(true)
    expect(toastMock.success).toHaveBeenCalledWith('Change applied — save to persist it')
  })

  it('keeps the job when the archive is cancelled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('job-archive-J1'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(world.em.jobs.find('J1')?.isArchived()).toBe(false)
  })

  it('creates a job and navigates to its detail page', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('add-job-button'))
    const dialog = within(screen.getByRole('dialog'))
    await user.type(dialog.getByPlaceholderText('Search clients…'), 'Acme')
    await user.click(screen.getByRole('option', { name: 'Acme Corp' }))
    await user.type(dialog.getByLabelText(/Description/), 'Brand new job')
    await user.click(dialog.getByRole('button', { name: 'Create job' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/jobs/J5')
  })

  it('edits a job from its row without navigating', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('job-edit-J1'))
    const dialog = within(screen.getByRole('dialog'))
    const description = dialog.getByLabelText(/Description/)
    await user.clear(description)
    await user.type(description, 'Phone case v2')
    await user.click(dialog.getByRole('button', { name: 'Save' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/jobs')
    expect(screen.getByRole('cell', { name: 'Phone case v2' })).toBeInTheDocument()
  })
})
