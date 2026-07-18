import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobDetailPage } from '@/Controller/JobDetailPage'
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
 * J1 (Acme, in_progress, due 2024-05-01) holds:
 *   P1 "Shell"  — priced €21 × 2 units, 10g PLA (INV1) + 1 nozzle (INV2)
 *   P2 "Arm"    — unpriced, no units, no lines
 * INV1: 900g left, avg cost €0.02/g (lot L1). INV2: 3 left, avg €5 (lot L2).
 * INV3 is equipment with no lots at all.
 */
function seedWorld(): TestWorld {
  return createWorld({
    clients: [{ id: 'CL1', name: 'Acme Corp', created_at: '2024-01-01' }],
    jobs: [
      { id: 'J1', client_id: 'CL1', description: 'Phone case', status: 'in_progress', created_at: '2024-05-01T09:00:00.000Z', due_date: '2024-05-01' },
      { id: 'J2', client_id: 'CL1', description: 'Deleted job', status: 'draft', created_at: '2024-05-02T09:00:00.000Z', deleted: 'true' },
      { id: 'J3', client_id: 'CL9', description: 'Orphan client', status: 'draft', created_at: '2024-05-03T09:00:00.000Z' },
      { id: 'J5', client_id: 'CL1', description: 'Shelved build', status: 'draft', created_at: '2024-05-05T09:00:00.000Z', archived: 'true' },
    ],
    pieces: [
      { id: 'P1', job_id: 'J1', name: 'Shell', status: 'pending', price: '21', units: '2', created_at: '2024-05-01T10:00:00.000Z' },
      { id: 'P2', job_id: 'J1', name: 'Arm', status: 'pending', created_at: '2024-05-01T11:00:00.000Z' },
      { id: 'P3', job_id: 'J1', name: 'Gone', status: 'pending', created_at: '2024-05-01T12:00:00.000Z', deleted: 'true' },
      { id: 'P9', job_id: 'J5', name: 'Shelved piece', status: 'pending', created_at: '2024-05-05T10:00:00.000Z', archived: 'true' },
    ],
    piece_items: [
      { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '10' },
      { id: 'PI2', piece_id: 'P1', inventory_id: 'INV2', quantity: '1' },
    ],
    inventory: [
      { id: 'INV1', type: 'filament', name: 'PLA White', qty_current: '900', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV2', type: 'consumable', name: 'Nozzle', qty_current: '3', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV3', type: 'equipment', name: 'Ender 3', qty_current: '1', created_at: '2024-01-01T00:00:00.000Z' },
    ],
    lots: [
      { id: 'L1', inventory_id: 'INV1', transaction_id: 'T9', quantity: '1000', amount: '20', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'L2', inventory_id: 'INV2', transaction_id: 'T9', quantity: '2', amount: '10', created_at: '2024-01-01T00:00:00.000Z' },
    ],
  })
}

function renderPage(entry = '/jobs/J1', path = '/jobs/:jobId') {
  return renderRoute(<JobDetailPage />, { path, entry })
}

function widget(name: string): HTMLElement {
  return screen.getByTestId(`job-widget-${name}`)
}

beforeEach(() => {
  world = seedWorld()
  metadataMock.value = { metadata: null, loading: false, error: null }
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('JobDetailPage', () => {
  it('renders a NotFoundCard for an unknown job', () => {
    renderPage('/jobs/J404')
    expect(screen.getByText('Job not found.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to jobs' })).toHaveAttribute('href', '/jobs')
  })

  it('renders a NotFoundCard for a soft-deleted job', () => {
    renderPage('/jobs/J2')
    expect(screen.getByText('Job not found.')).toBeInTheDocument()
  })

  it('renders a NotFoundCard when the route binds no id', () => {
    renderPage('/jobs/J1', '/jobs/:other')
    expect(screen.getByText('Job not found.')).toBeInTheDocument()
  })

  it('shows the back link and the id widget', () => {
    renderPage()
    expect(screen.getByTestId('entity-detail-back')).toHaveAttribute('href', '/jobs')
    expect(widget('id')).toHaveTextContent('J1 — Phone case')
  })

  it('shows the client widget linking to the client', () => {
    renderPage()
    expect(within(widget('client')).getByRole('link')).toHaveAttribute('href', '/clients/CL1')
    expect(widget('client')).toHaveTextContent('Acme Corp')
  })

  it('falls back to the client id when the client row is missing', () => {
    renderPage('/jobs/J3')
    expect(widget('client')).toHaveTextContent('CL9')
  })

  it('shows the incomplete badge for total and benefit while a piece is unpriced', () => {
    renderPage()
    expect(widget('total')).toHaveTextContent('Incomplete pricing')
    expect(widget('beneficio')).toHaveTextContent('Incomplete pricing')
  })

  it('shows the material aggregates', () => {
    renderPage()

    // 10g × 2 units.
    expect(widget('filament')).toHaveTextContent('20 g')
    // 1 nozzle × 2 units.
    expect(widget('consumibles')).toHaveTextContent('2 units')
    // 20g × €0.02 + 2 × €5.
    expect(widget('material-cost')).toHaveTextContent('€10.40')
    expect(within(widget('material-cost')).getByText('€10.40')).toHaveClass('text-danger')
  })

  it('shows the risk factor from the tightest filament margin', () => {
    renderPage()
    // 900g in stock against a 20g run.
    expect(widget('risk-factor')).toHaveTextContent('44 redos (PLA White)')
  })

  it('says so when the job uses no filament', () => {
    world.em.pieceItems.remove('PI1')
    renderPage()
    expect(widget('risk-factor')).toHaveTextContent('No filament lines')
    expect(widget('filament')).toHaveTextContent('0 g')
  })

  it('aggregates degenerate lines without letting them skew the widgets', () => {
    world.tabs.seed('inventory', [
      // Runs out after this job: 30g left against a 20g need.
      { id: 'INV5', type: 'filament', name: 'PLA Blue', qty_current: '30', created_at: '2024-01-01T00:00:00.000Z' },
      // Plenty of stock, but examined after PLA Blue already set the risk.
      { id: 'INV6', type: 'filament', name: 'PLA Green', qty_current: '900', created_at: '2024-01-01T00:00:00.000Z' },
    ])
    world.tabs.seed('piece_items', [
      // Unknown inventory: skipped entirely.
      { id: 'PI3', piece_id: 'P1', inventory_id: 'INV404', quantity: '5' },
      // Equipment with no lots: neither filament nor consumable, no cost.
      { id: 'PI4', piece_id: 'P1', inventory_id: 'INV3', quantity: '1' },
      // No quantity: nothing to count.
      { id: 'PI5', piece_id: 'P1', inventory_id: 'INV5' },
      { id: 'PI6', piece_id: 'P1', inventory_id: 'INV5', quantity: '10' },
      { id: 'PI7', piece_id: 'P1', inventory_id: 'INV6', quantity: '10' },
    ])
    renderPage()

    // 20g of PLA White + 20g Blue + 20g Green; PI5 adds nothing.
    expect(widget('filament')).toHaveTextContent('60 g')
    expect(widget('consumibles')).toHaveTextContent('2 units')
    // Only PLA White and the nozzles have lots to price.
    expect(widget('material-cost')).toHaveTextContent('€10.40')
    // 30g Blue against a 20g run leaves no full redo; Green cannot relax it.
    expect(widget('risk-factor')).toHaveTextContent('0 redos (PLA Blue)')
  })

  it('computes total and benefit once every piece is priced', async () => {
    const user = userEvent.setup()
    renderPage()

    const units = screen.getByTestId('piece-units-P2')
    await user.type(units, '1')
    await user.tab()
    const price = screen.getByTestId('piece-price-P2')
    await user.type(price, '8')
    await user.tab()

    // €21 × 2 + €8 × 1.
    expect(widget('total')).toHaveTextContent('€50.00')
    // €50 − €10.40 of materials.
    expect(widget('beneficio')).toHaveTextContent('€39.60')
  })

  it('shows a negative benefit in red', async () => {
    const user = userEvent.setup()
    renderPage()

    const price = screen.getByTestId('piece-price-P1')
    await user.clear(price)
    await user.type(price, '1')
    await user.tab()
    await user.type(screen.getByTestId('piece-units-P2'), '1')
    await user.tab()
    await user.type(screen.getByTestId('piece-price-P2'), '0')
    await user.tab()

    // €2 of pieces against €10.40 of materials.
    expect(within(widget('beneficio')).getByText('-€8.40')).toHaveClass('text-danger')
  })

  it('bands the due date and edits it inline', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(within(widget('due-date')).getByText('2024-05-01')).toHaveAttribute('data-band', 'red')

    await user.click(screen.getByTestId('job-due-date-edit'))
    const input = screen.getByLabelText('Due date for job J1')
    await user.clear(input)
    await user.type(input, '2024-06-30')
    await user.tab()

    expect(world.em.jobs.find('J1')?.dueDate).toBe('2024-06-30')
    expect(within(widget('due-date')).getByText('2024-06-30')).toBeInTheDocument()
    expect(toastMock.success).toHaveBeenCalledWith('Change applied — save to persist it')
  })

  it('leaves the due date alone when the inline edit changes nothing', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('job-due-date-edit'))
    await user.tab()

    expect(toastMock.success).not.toHaveBeenCalled()
    expect(within(widget('due-date')).getByText('2024-05-01')).toBeInTheDocument()
  })

  it('archives the job from the widget and returns to the list', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('entity-detail-archive'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Archive job' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Archive' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/jobs')
    expect(world.em.jobs.find('J1')?.isArchived()).toBe(true)
    expect(world.em.pieces.find('P1')?.isArchived()).toBe(true)
  })

  it('offers no soft delete while the job is active', () => {
    renderPage()
    expect(screen.queryByTestId('entity-detail-delete')).not.toBeInTheDocument()
    expect(screen.queryByTestId('entity-detail-unarchive')).not.toBeInTheDocument()
  })

  it('keeps the job when the lifecycle dialog is cancelled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('entity-detail-archive'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(world.em.jobs.find('J1')?.isArchived()).toBe(false)
  })

  it('edits the job from the widget', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('entity-detail-edit'))
    const dialog = within(screen.getByRole('dialog'))
    const description = dialog.getByLabelText(/Description/)
    await user.clear(description)
    await user.type(description, 'Phone case v2')
    await user.click(dialog.getByRole('button', { name: 'Save' }))

    expect(widget('id')).toHaveTextContent('J1 — Phone case v2')
  })

  it('routes a status change through the shared flow', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(within(widget('status')).getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Delivered' }))

    expect(world.em.jobs.find('J1')?.status).toBe('delivered')
  })

  it('marks the job paid through the confirmation dialog and refreshes the widgets', async () => {
    const user = userEvent.setup()
    // Price the outstanding piece so the paid transition is allowed.
    const piece = world.em.pieces.find('P2')
    if (piece !== null) {
      piece.price = 8
      piece.units = 1
      world.em.pieces.save(piece)
    }
    renderPage()

    await user.click(within(widget('status')).getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Paid' }))

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Mark job as paid' })
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(world.em.jobs.find('J1')?.status).toBe('paid')
    // €21 × 2 + €8 × 1, booked as income by the confirmed dialog.
    expect(
      world.em.transactions.findAll().some((transaction) => transaction.amount === 50)
    ).toBe(true)
  })

  it('keeps the stored due date when the service refuses the edit', async () => {
    const user = userEvent.setup()
    // A legacy row can miss its client; the update then fails validation.
    world.tabs.seed('jobs', [
      { id: 'J4', client_id: '', description: 'Orphan row', status: 'draft', created_at: '2024-05-04T09:00:00.000Z', due_date: '2024-05-10' },
    ])
    renderPage('/jobs/J4')

    await user.click(screen.getByTestId('job-due-date-edit'))
    const input = screen.getByLabelText('Due date for job J4')
    await user.clear(input)
    await user.type(input, '2024-06-30')
    await user.tab()

    expect(toastMock.error).toHaveBeenCalledWith('Select a client')
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(world.em.jobs.find('J4')?.dueDate).toBe('2024-05-10')
  })

  it('blocks paid while a piece is unpriced', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(within(widget('status')).getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Paid' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Set a per-unit price and a units count on every piece'
    )
    expect(world.em.jobs.find('J1')?.status).toBe('in_progress')
  })

  it('mounts the tags and notes sections for the job', () => {
    renderPage()
    expect(screen.getByTestId('job-tags-section')).toBeInTheDocument()
    expect(screen.getByTestId('job-notes-section')).toBeInTheDocument()
  })

  it('creates a piece without asking for a job', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('add-piece-button'))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.queryByPlaceholderText('Search jobs…')).not.toBeInTheDocument()

    await user.type(dialog.getByLabelText(/Name/), 'Lid')
    await user.click(dialog.getByRole('button', { name: 'Create piece' }))

    expect(world.em.pieces.find('P10')).toMatchObject({ jobId: 'J1', name: 'Lid', status: 'pending' })
    expect(screen.getByTestId('piece-name-P10')).toHaveValue('Lid')
  })

  it('rejects a blank piece name', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('add-piece-button'))
    await user.click(screen.getByRole('button', { name: 'Create piece' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Name is required')
  })

  it('filters pieces and shows the no-matches message', async () => {
    const user = userEvent.setup()
    renderPage()

    const search = screen.getByPlaceholderText('Search pieces…')
    await user.type(search, 'Shell')
    expect(screen.getByTestId('piece-name-P1')).toBeInTheDocument()
    expect(screen.queryByTestId('piece-name-P2')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'zzzznomatch')
    expect(screen.getByText('No rows match your search.')).toBeInTheDocument()
  })

  it('shows the empty message when the job has no piece', () => {
    renderPage('/jobs/J3')
    expect(screen.getByText('No pieces yet.')).toBeInTheDocument()
  })

  it('lists soft-deleted pieces struck through as deleted entities', () => {
    renderPage()
    // Children are history: the row stays, read-only and labelled.
    expect(screen.getByTestId('piece-name-text-P3')).toHaveTextContent('Gone')
    expect(screen.getByTestId('piece-deleted-P3')).toHaveTextContent('Deleted entity')
    expect(screen.queryByTestId('piece-name-P3')).not.toBeInTheDocument()
  })

  describe('archived job', () => {
    it('renders read-only with Un-archive and Soft delete only', () => {
      renderPage('/jobs/J5')

      expect(screen.getByTestId('entity-archived-notice')).toBeInTheDocument()
      expect(screen.getByTestId('entity-detail-unarchive')).toBeInTheDocument()
      expect(screen.getByTestId('entity-detail-delete')).toBeInTheDocument()
      expect(screen.queryByTestId('entity-detail-edit')).not.toBeInTheDocument()
      expect(screen.queryByTestId('entity-detail-archive')).not.toBeInTheDocument()

      // The status combobox gives way to plain text.
      expect(within(widget('status')).queryByRole('combobox')).not.toBeInTheDocument()
      expect(widget('status')).toHaveTextContent('Draft')
      // The due date is no longer clickable.
      expect(screen.queryByTestId('job-due-date-edit')).not.toBeInTheDocument()
      // No piece can be added, and the archived piece row is read-only.
      expect(screen.queryByTestId('add-piece-button')).not.toBeInTheDocument()
      expect(screen.getByTestId('piece-name-text-P9')).toHaveTextContent('Shelved piece')
      // Tags and notes lose their edit affordances.
      expect(screen.queryByTestId('job-note-add')).not.toBeInTheDocument()
      expect(within(screen.getByTestId('job-tags-section')).queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('un-archives back to the editable state', async () => {
      const user = userEvent.setup()
      renderPage('/jobs/J5')

      await user.click(screen.getByTestId('entity-detail-unarchive'))

      expect(world.em.jobs.find('J5')?.isActive()).toBe(true)
      expect(toastMock.success).toHaveBeenCalledWith('Change applied — save to persist it')
      expect(screen.getByTestId('entity-detail-edit')).toBeInTheDocument()
      expect(screen.queryByTestId('entity-archived-notice')).not.toBeInTheDocument()
      // The cascade is not undone: the piece stays archived, offering Un-archive.
      expect(screen.getByTestId('piece-unarchive-P9')).toBeInTheDocument()
    })

    it('soft-deletes after confirming and returns to the list', async () => {
      const user = userEvent.setup()
      renderPage('/jobs/J5')

      await user.click(screen.getByTestId('entity-detail-delete'))
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByRole('heading', { name: 'Delete job' })).toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: 'Soft delete' }))

      expect(screen.getByTestId('location')).toHaveTextContent('/jobs')
      expect(world.em.jobs.find('J5')?.isDeleted()).toBe(true)
    })
  })
})
