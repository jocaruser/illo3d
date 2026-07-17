import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientDetailPage } from '@/Controller/ClientDetailPage'
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

function seedWorld(): TestWorld {
  return createWorld({
    clients: [
      {
        id: 'CL1',
        name: 'Acme Corp',
        email: 'hi@acme.test',
        phone: '600',
        notes: 'sheet level note',
        preferred_contact: 'email',
        lead_source: 'referred by @CL2 who saw @P1',
        address: '1 Main St',
        created_at: '2024-01-02',
      },
      { id: 'CL2', name: 'Bare Co', created_at: '2024-01-03' },
      { id: 'CL3', name: 'Gone Co', created_at: '2024-01-04', deleted: 'true' },
      { id: 'CL4', name: 'Empty Co', created_at: '2024-01-05' },
    ],
    jobs: [
      { id: 'J1', client_id: 'CL1', description: 'Phone case', status: 'paid', created_at: '2024-05-01T09:00:00.000Z', due_date: '2024-05-30' },
      { id: 'J2', client_id: 'CL1', description: 'Bracket', status: 'draft', created_at: '2024-05-02T09:00:00.000Z', archived: 'true' },
      { id: 'J3', client_id: 'CL1', description: 'Old gear', status: 'draft', created_at: '2024-05-03T09:00:00.000Z', deleted: 'true' },
      { id: 'J4', client_id: 'CL2', description: 'Other client job', status: 'draft', created_at: '2024-05-04T09:00:00.000Z' },
    ],
    pieces: [
      { id: 'P1', job_id: 'J1', name: 'Shell', status: 'done', price: '21', units: '2', created_at: '2024-05-01T10:00:00.000Z' },
    ],
    piece_items: [{ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '10' }],
    inventory: [{ id: 'INV1', type: 'filament', name: 'PLA White', qty_current: '900', created_at: '2024-01-01T00:00:00.000Z' }],
    lots: [{ id: 'L1', inventory_id: 'INV1', transaction_id: 'T9', quantity: '1000', amount: '20', created_at: '2024-01-01T00:00:00.000Z' }],
    transactions: [
      { id: 'T1', date: '2024-05-05', type: 'income', amount: '42', category: 'job', concept: 'Phone case', ref_type: 'job', ref_id: 'J1', client_id: 'CL1' },
    ],
  })
}

function renderPage(entry = '/clients/CL1', path = '/clients/:clientId') {
  return renderRoute(<ClientDetailPage />, { path, entry })
}

beforeEach(() => {
  world = seedWorld()
  metadataMock.value = { metadata: null, loading: false, error: null }
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('ClientDetailPage', () => {
  it('shows every populated field, linkifying the lead source', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument()
    expect(screen.getByTestId('entity-detail-back')).toHaveAttribute('href', '/clients')
    expect(screen.getByText('CL1')).toBeInTheDocument()
    expect(screen.getByText('hi@acme.test')).toBeInTheDocument()
    expect(screen.getByText('600')).toBeInTheDocument()
    expect(screen.getByText('email')).toBeInTheDocument()
    expect(screen.getByText('1 Main St')).toBeInTheDocument()
    expect(screen.getByText('2024-01-02')).toBeInTheDocument()
    expect(screen.getByText('sheet level note')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '@CL2' })).toHaveAttribute('href', '/clients/CL2')
    // A piece mention resolves through to its job's detail anchor.
    expect(screen.getByRole('link', { name: '@P1' })).toHaveAttribute('href', '/jobs/J1#piece-P1')
  })

  it('omits optional fields that are empty', () => {
    renderPage('/clients/CL2')

    expect(screen.getByRole('heading', { name: 'Bare Co' })).toBeInTheDocument()
    expect(screen.queryByText('Preferred contact')).not.toBeInTheDocument()
    expect(screen.queryByText('Lead source')).not.toBeInTheDocument()
    expect(screen.queryByText('Address')).not.toBeInTheDocument()
    expect(screen.queryByText('Sheet note')).not.toBeInTheDocument()
  })

  it('shows the five client metrics', () => {
    renderPage()
    const metrics = within(screen.getByTestId('client-metrics'))

    expect(metrics.getByText('Paid (ledger)').nextSibling).toHaveTextContent('€42.00')
    // J1 is paid, so nothing is outstanding.
    expect(metrics.getByText('Outstanding (jobs)').nextSibling).toHaveTextContent('€0.00')
    // Only J1 is active: archived J2 and soft-deleted J3 are both excluded.
    expect(metrics.getByText('Jobs').nextSibling).toHaveTextContent('1')
    expect(metrics.getByText('Avg job price').nextSibling).toHaveTextContent('€42.00')
    // 10g/unit × 2 units × €0.02/g.
    expect(metrics.getByText('Materials (estimate)').nextSibling).toHaveTextContent('€0.40')
  })

  it('shows a dash for the average price when no job is priced', () => {
    renderPage('/clients/CL2')
    const metrics = within(screen.getByTestId('client-metrics'))
    expect(metrics.getByText('Avg job price').nextSibling).toHaveTextContent('—')
  })

  it('renders a NotFoundCard for an unknown client', () => {
    renderPage('/clients/CL404')
    expect(screen.getByText('Client not found.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to clients' })).toHaveAttribute('href', '/clients')
  })

  it('renders a NotFoundCard for a soft-deleted client', () => {
    renderPage('/clients/CL3')
    expect(screen.getByText('Client not found.')).toBeInTheDocument()
  })

  it('renders a NotFoundCard when the route binds no id', () => {
    renderPage('/clients/CL1', '/clients/:other')
    expect(screen.getByText('Client not found.')).toBeInTheDocument()
  })

  it('lists jobs including archived and soft-deleted ones', () => {
    renderPage()

    expect(screen.getByTestId('client-job-link-J1')).toBeInTheDocument()
    expect(screen.getByTestId('client-job-link-J2')).toHaveClass('line-through')
    expect(screen.getByTestId('client-job-link-J3')).toHaveClass('line-through')
    // A job of another client stays out.
    expect(screen.queryByTestId('client-job-link-J4')).not.toBeInTheDocument()
  })

  it('offers un-archive instead of edit for an archived job', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByTestId('client-job-edit-J2')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('client-job-unarchive-J2'))

    expect(world.em.jobs.find('J2')?.isArchived()).toBe(false)
    expect(screen.getByTestId('client-job-edit-J2')).toBeInTheDocument()
  })

  it('labels a soft-deleted job and offers it no actions', () => {
    renderPage()

    expect(screen.getByTestId('client-job-deleted-J3')).toHaveTextContent('Deleted entity')
    expect(screen.queryByTestId('client-job-edit-J3')).not.toBeInTheDocument()
    expect(screen.queryByTestId('client-job-archive-J3')).not.toBeInTheDocument()
  })

  it('sorts the jobs table by created date descending first', () => {
    renderPage()
    const ids = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(ids).toEqual(['J3', 'J2', 'J1'])
  })

  it.each([
    ['ID', ['J1', 'J2', 'J3']],
    // Bracket, Old gear, Phone case.
    ['Description', ['J2', 'J3', 'J1']],
    // draft, draft, paid — the two drafts tie and fall back to the id.
    ['Status', ['J2', 'J3', 'J1']],
    // J2/J3 have no due date and inherit their creation instant, both in May.
    ['Due date', ['J2', 'J3', 'J1']],
  ])('sorts the jobs table by %s', async (column, expected) => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: `Sort by ${column}` }))
    const ids = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(ids).toEqual(expected)
  })

  it('flips the default created sort to ascending', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Created, sorted descending' }))
    const ids = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(ids).toEqual(['J1', 'J2', 'J3'])
  })

  it('filters the jobs table and shows the no-matches message', async () => {
    const user = userEvent.setup()
    renderPage()

    const search = screen.getByPlaceholderText('Search jobs…')
    await user.type(search, 'Bracket')
    expect(screen.getByTestId('client-job-link-J2')).toBeInTheDocument()
    expect(screen.queryByTestId('client-job-link-J1')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'zzzznomatch')
    expect(screen.getByText('No rows match your search.')).toBeInTheDocument()
  })

  it('hides the search and shows the empty message when the client has no job', () => {
    renderPage('/clients/CL4')

    expect(screen.queryByPlaceholderText('Search jobs…')).not.toBeInTheDocument()
    expect(screen.getByText('No jobs for this client yet.')).toBeInTheDocument()
  })

  it('creates a job with the client preset', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('add-job-button'))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.queryByPlaceholderText('Search clients…')).not.toBeInTheDocument()

    await user.type(dialog.getByLabelText(/Description/), 'Fresh job')
    await user.click(dialog.getByRole('button', { name: 'Create job' }))

    expect(world.em.jobs.find('J5')?.clientId).toBe('CL1')
    expect(screen.getByTestId('client-job-link-J5')).toBeInTheDocument()
  })

  it('edits a job from its row with the client picker unlocked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('client-job-edit-J1'))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByPlaceholderText('Search clients…')).toHaveValue('Acme Corp')

    const description = dialog.getByLabelText(/Description/)
    await user.clear(description)
    await user.type(description, 'Phone case v2')
    await user.click(dialog.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('cell', { name: 'Phone case v2' })).toBeInTheDocument()
  })

  it('archives a job from its row after confirming', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('client-job-archive-J1'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Archive job' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Archive' }))

    expect(world.em.jobs.find('J1')?.isArchived()).toBe(true)
    expect(screen.getByTestId('client-job-unarchive-J1')).toBeInTheDocument()
  })

  it('keeps the job when its archive is cancelled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('client-job-archive-J1'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(world.em.jobs.find('J1')?.isArchived()).toBe(false)
  })

  it('edits the client from the detail actions', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('entity-detail-edit'))
    const dialog = screen.getByRole('dialog')
    const name = within(dialog).getByLabelText(/Name/)
    await user.clear(name)
    await user.type(name, 'Acme Renamed')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('heading', { name: 'Acme Renamed' })).toBeInTheDocument()
  })

  it('archives the client and returns to the list', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('entity-detail-archive'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Archive Acme Corp\?/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Archive' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/clients')
    expect(world.em.clients.find('CL1')?.isArchived()).toBe(true)
    // The cascade reaches the client's jobs.
    expect(world.em.jobs.find('J1')?.isArchived()).toBe(true)
  })

  it('keeps the client when its archive is cancelled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('entity-detail-archive'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(world.em.clients.find('CL1')?.isArchived()).toBe(false)
  })

  it('mounts the tags, notes and activity sections for the client', () => {
    renderPage()

    expect(screen.getByTestId('client-tags-section')).toBeInTheDocument()
    expect(screen.getByTestId('client-notes-section')).toBeInTheDocument()
    expect(screen.getByTestId('client-activity-timeline')).toBeInTheDocument()
  })
})
