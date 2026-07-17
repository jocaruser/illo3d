import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientsPage } from '@/Controller/ClientsPage'
import type { EntityManager } from '@/Repository/EntityManager'
import {
  createWorld,
  renderRoute,
  type TestWorld,
} from '../Component/detail/helpers/renderDetail'

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}))

let world: TestWorld

vi.mock('@/Hook/useEntityManager', () => ({
  useEntityManager: (): EntityManager => world.em,
}))
vi.mock('@/Component/Toast', () => ({ toast: toastMock }))

function seedWorld(): TestWorld {
  return createWorld({
    clients: [
      { id: 'CL1', name: 'Acme Corp', email: 'hi@acme.test', phone: '600', notes: 'shared', created_at: '2024-01-02' },
      { id: 'CL2', name: 'Beta LLC', email: 'ops@beta.test', phone: '700', notes: 'second', created_at: '2024-03-04' },
      { id: 'CL10', name: 'Zenith', email: '', phone: '', notes: 'shared', created_at: '2024-02-01' },
      { id: 'CL3', name: 'Archived Co', email: '', phone: '', notes: '', created_at: '2024-01-01', archived: 'true' },
    ],
    tags: [
      { id: 'TG1', name: 'Vip', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'TG2', name: 'Stale', created_at: '2024-01-01T00:00:00.000Z', archived: 'true' },
    ],
    tag_links: [
      { id: 'TL1', tag_id: 'TG1', entity_type: 'client', entity_id: 'CL1', created_at: '2024-01-01T00:00:00.000Z' },
      // A job link and a link to an archived tag: neither may reach a client tooltip.
      { id: 'TL2', tag_id: 'TG1', entity_type: 'job', entity_id: 'J1', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'TL3', tag_id: 'TG2', entity_type: 'client', entity_id: 'CL2', created_at: '2024-01-01T00:00:00.000Z' },
    ],
    jobs: [{ id: 'J1', client_id: 'CL2', description: 'Case', status: 'draft', created_at: '2024-03-05T00:00:00.000Z' }],
  })
}

function renderPage() {
  return renderRoute(<ClientsPage />, { path: '/clients', entry: '/clients' })
}

/** Data rows only — the header row and the in-table empty row are excluded. */
function dataRowIds(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '')
}

beforeEach(() => {
  world = seedWorld()
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('ClientsPage', () => {
  it('lists only active clients, id-sorted naturally', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument()
    // CL10 sorts after CL2, not between CL1 and CL2.
    expect(dataRowIds()).toEqual(['CL1', 'CL2', 'CL10'])
    expect(screen.queryByText('Archived Co')).not.toBeInTheDocument()
  })

  it('links each id to the client detail route', () => {
    renderPage()
    expect(screen.getByTestId('client-detail-link-CL1')).toHaveAttribute('href', '/clients/CL1')
  })

  it('starts sorted by id ascending and flips to descending', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )

    await user.click(screen.getByRole('button', { name: 'ID, sorted ascending' }))
    expect(dataRowIds()).toEqual(['CL10', 'CL2', 'CL1'])
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute(
      'aria-sort',
      'descending'
    )
  })

  it.each([
    ['Name', 1, ['Acme Corp', 'Beta LLC', 'Zenith']],
    ['Notes', 4, ['second', 'shared', 'shared']],
  ])('sorts ascending by %s', async (column, cellIndex, expected) => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: `Sort by ${column}` }))
    const cells = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[cellIndex].textContent)
    expect(cells).toEqual(expected)
  })

  it('breaks a tie on the id, naturally', async () => {
    const user = userEvent.setup()
    renderPage()

    // CL1 and CL10 share their notes, so the id decides — and CL1 precedes CL10.
    await user.click(screen.getByRole('button', { name: 'Sort by Notes' }))
    expect(dataRowIds()).toEqual(['CL2', 'CL1', 'CL10'])
  })

  it('ignores job tag links and links to archived tags', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.hover(screen.getByTestId('client-name-tooltip-CL2'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('sorts by email, sinking the blank one to the bottom', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Sort by Email' }))
    expect(dataRowIds()).toEqual(['CL1', 'CL2', 'CL10'])
  })

  it('keeps blank cells last in both directions', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Sort by Phone' }))
    expect(dataRowIds()).toEqual(['CL1', 'CL2', 'CL10'])

    await user.click(screen.getByRole('button', { name: 'Phone, sorted ascending' }))
    // Zenith still trails despite the descending flip: it has no phone at all.
    expect(dataRowIds()).toEqual(['CL2', 'CL1', 'CL10'])
  })

  it('sorts by created date in both directions', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Sort by Created' }))
    expect(dataRowIds()).toEqual(['CL1', 'CL10', 'CL2'])

    await user.click(screen.getByRole('button', { name: 'Created, sorted ascending' }))
    expect(dataRowIds()).toEqual(['CL2', 'CL10', 'CL1'])
  })

  it('fuzzy-filters rows and shows the no-matches message', async () => {
    const user = userEvent.setup()
    renderPage()

    const search = screen.getByRole('searchbox')
    await user.type(search, 'Beta')
    expect(dataRowIds()).toEqual(['CL2'])

    await user.clear(search)
    await user.type(search, 'zzzznomatch')
    expect(screen.getByText('No rows match your search.')).toBeInTheDocument()
  })

  it('matches a client by its tag name', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByRole('searchbox'), 'Vip')
    expect(dataRowIds()).toEqual(['CL1'])
  })

  it('shows the empty-collection message when no client exists', () => {
    world = createWorld({})
    renderPage()
    expect(screen.getByText('No clients yet.')).toBeInTheDocument()
  })

  it('shows tag names in a portal tooltip on hover and hides them on leave', async () => {
    const user = userEvent.setup()
    renderPage()

    const trigger = screen.getByTestId('client-name-tooltip-CL1')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(trigger)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tags: Vip')

    await user.unhover(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders no tooltip for a client without tags', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.hover(screen.getByTestId('client-name-tooltip-CL2'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('archives a client and cascades to its jobs', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('client-archive-CL2'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Archive Beta LLC\?/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Archive' }))

    expect(dataRowIds()).toEqual(['CL1', 'CL10'])
    expect(world.em.clients.find('CL2')?.isArchived()).toBe(true)
    expect(world.em.jobs.find('J1')?.isArchived()).toBe(true)
    expect(toastMock.success).toHaveBeenCalledWith('Change applied — save to persist it')
  })

  it('keeps the client when archiving is cancelled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('client-archive-CL2'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(world.em.clients.find('CL2')?.isArchived()).toBe(false)
  })

  it('creates a client and navigates to its detail page', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('add-client-button'))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Name/), 'Gamma Ltd')
    await user.click(within(dialog).getByRole('button', { name: 'Create client' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/clients/CL11')
    expect(world.em.clients.find('CL11')?.name).toBe('Gamma Ltd')
  })

  it('edits a client from its row without navigating', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('client-edit-CL1'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Edit client' })).toBeInTheDocument()

    const name = within(dialog).getByLabelText(/Name/)
    await user.clear(name)
    await user.type(name, 'Acme Renamed')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/clients')
    expect(screen.getByRole('cell', { name: 'Acme Renamed' })).toBeInTheDocument()
  })
})
