import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PieceItemsTable } from '@/Component/detail/PieceItemsTable'
import { Piece } from '@/Entity/Piece'
import type { EntityManager } from '@/Repository/EntityManager'
import { createWorld, renderWithProviders, type TestWorld } from './helpers/renderDetail'

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}))

let world: TestWorld

vi.mock('@/Hook/useEntityManager', () => ({
  useEntityManager: (): EntityManager => world.em,
}))
vi.mock('@/Component/Toast', () => ({ toast: toastMock }))

/**
 * P1 has 2 units and one 10g line on INV1 (900g @ €0.02/g).
 * INV2 "Nozzle" is a free consumable, INV3 "Ender 3" is archived, INV4 has no lots.
 */
function seedWorld(): TestWorld {
  return createWorld({
    pieces: [
      { id: 'P1', job_id: 'J1', name: 'Shell', status: 'pending', price: '21', units: '2', created_at: '2024-05-01T10:00:00.000Z' },
      { id: 'P2', job_id: 'J1', name: 'Arm', status: 'pending', created_at: '2024-05-01T11:00:00.000Z' },
    ],
    piece_items: [{ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '10' }],
    inventory: [
      { id: 'INV1', type: 'filament', name: 'PLA White', qty_current: '900', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV2', type: 'consumable', name: 'Nozzle', qty_current: '10', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV3', type: 'equipment', name: 'Ender 3', qty_current: '1', created_at: '2024-01-01T00:00:00.000Z', archived: 'true' },
      { id: 'INV4', type: 'consumable', name: 'Glue', qty_current: '4', created_at: '2024-01-01T00:00:00.000Z' },
    ],
    lots: [
      { id: 'L1', inventory_id: 'INV1', transaction_id: 'T9', quantity: '1000', amount: '20', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'L2', inventory_id: 'INV2', transaction_id: 'T9', quantity: '5', amount: '5', created_at: '2024-01-01T00:00:00.000Z' },
    ],
  })
}

function piece(id = 'P1'): Piece {
  return world.em.pieces.find(id) as Piece
}

function renderTable(pieceId = 'P1', onChanged = vi.fn()) {
  return renderWithProviders(<PieceItemsTable piece={piece(pieceId)} onChanged={onChanged} />)
}

beforeEach(() => {
  world = seedWorld()
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('PieceItemsTable', () => {
  it('lists a line with its cost and stock band', () => {
    renderTable()

    const row = screen.getByTestId('piece-item-row-PI1')
    expect(within(row).getByText('PI1')).toBeInTheDocument()
    expect(screen.getByTestId('piece-item-qty-PI1')).toHaveValue(10)
    // 10g × 2 units × €0.02/g.
    expect(within(row).getByText('€0.40')).toBeInTheDocument()
    // 900g covers a 20g run 44 times over.
    expect(within(row).getByText('Safe (44 redos)')).toBeInTheDocument()
  })

  it('shows the empty state when the piece has no line', () => {
    renderTable('P2')
    expect(screen.getByText('No material lines yet.')).toBeInTheDocument()
  })

  it('dashes the cost when the inventory item has no purchase data', () => {
    world.em.pieceItems.save(
      Object.assign(world.em.pieceItems.find('PI1') as never, { id: 'PI2', inventoryId: 'INV4' })
    )
    renderTable()

    const row = screen.getByTestId('piece-item-row-PI2')
    expect(within(row).getByText('—')).toBeInTheDocument()
  })

  it('labels filament in grams and other types in units', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(within(screen.getByTestId('piece-item-inventory-PI1')).getByRole('combobox'))
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual([
      'PLA White (INV1) — 900g left',
      'Nozzle (INV2) — 10 left',
      'Glue (INV4) — 4 left',
    ])
    // The archived Ender 3 is not offered.
    expect(options.join()).not.toContain('Ender 3')
  })

  it('updates a line quantity on blur', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable('P1', onChanged)

    const qty = screen.getByTestId('piece-item-qty-PI1')
    await user.clear(qty)
    await user.type(qty, '12')
    await user.tab()

    expect(world.em.pieceItems.find('PI1')?.quantity).toBe(12)
    expect(onChanged).toHaveBeenCalled()
  })

  it.each([
    ['0', 'zero'],
    ['-2', 'negative'],
    ['', 'blank'],
  ])('rejects a %s quantity (%s) and restores the stored value', async (value) => {
    const user = userEvent.setup()
    renderTable()

    const qty = screen.getByTestId('piece-item-qty-PI1')
    await user.clear(qty)
    if (value !== '') await user.type(qty, value)
    await user.tab()

    expect(screen.getByRole('alert')).toHaveTextContent('Quantity must be greater than zero')
    expect(world.em.pieceItems.find('PI1')?.quantity).toBe(10)
    expect(screen.getByTestId('piece-item-qty-PI1')).toHaveValue(10)
  })

  it('skips the save when the quantity is unchanged', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable('P1', onChanged)

    await user.click(screen.getByTestId('piece-item-qty-PI1'))
    await user.tab()

    expect(onChanged).not.toHaveBeenCalled()
  })

  it('switches a line to another inventory item', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(within(screen.getByTestId('piece-item-inventory-PI1')).getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Nozzle/ }))

    expect(world.em.pieceItems.find('PI1')?.inventoryId).toBe('INV2')
  })

  it('ignores re-picking the inventory a line already uses', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable('P1', onChanged)

    await user.click(within(screen.getByTestId('piece-item-inventory-PI1')).getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /PLA White/ }))

    expect(onChanged).not.toHaveBeenCalled()
  })

  it('rejects switching a line onto an inventory another line already uses', async () => {
    const user = userEvent.setup()
    world.em.pieceItems.save(
      Object.assign(world.em.pieceItems.find('PI1') as never, { id: 'PI2', inventoryId: 'INV2' })
    )
    renderTable()

    await user.click(within(screen.getByTestId('piece-item-inventory-PI1')).getByRole('combobox'))
    await user.click(screen.getAllByRole('option', { name: /Nozzle/ })[0])

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This piece already has a material line for that inventory item.'
    )
    expect(world.em.pieceItems.find('PI1')?.inventoryId).toBe('INV1')
  })

  it('appends a line from an inline draft row with the picker focused', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable('P1', onChanged)

    await user.click(screen.getByTestId('add-line-P1'))

    const draft = screen.getByTestId('piece-item-draft-P1')
    const picker = within(draft).getByRole('combobox')
    expect(picker).toHaveFocus()
    // The inline row is not a popup dialog.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: /Nozzle/ }))

    expect(world.em.pieceItems.find('PI2')).toMatchObject({
      pieceId: 'P1',
      inventoryId: 'INV2',
      quantity: 1,
    })
    expect(screen.queryByTestId('piece-item-draft-P1')).not.toBeInTheDocument()
    expect(onChanged).toHaveBeenCalled()
  })

  it('appends a line with a custom draft quantity', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByTestId('add-line-P1'))
    const draft = within(screen.getByTestId('piece-item-draft-P1'))
    const qty = draft.getByRole('spinbutton')
    await user.clear(qty)
    await user.type(qty, '7')

    // Typing the quantity blurs the picker, so reopen it before choosing.
    await user.click(draft.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Nozzle/ }))

    expect(world.em.pieceItems.find('PI2')?.quantity).toBe(7)
  })

  it('rejects a draft on an inventory the piece already uses', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByTestId('add-line-P1'))
    await user.click(screen.getAllByRole('option', { name: /PLA White/ })[0])

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This piece already has a material line for that inventory item.'
    )
    // The draft row stays open so the choice can be corrected.
    expect(screen.getByTestId('piece-item-draft-P1')).toBeInTheDocument()
    expect(world.em.pieceItems.findActiveByPiece('P1')).toHaveLength(1)
  })

  it('rejects a draft with a non-positive quantity', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByTestId('add-line-P1'))
    const draft = within(screen.getByTestId('piece-item-draft-P1'))
    const qty = draft.getByRole('spinbutton')
    await user.clear(qty)
    await user.type(qty, '0')

    await user.click(draft.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Nozzle/ }))

    expect(screen.getByRole('alert')).toHaveTextContent('Quantity must be greater than zero')
  })

  it('clears the inline error after a moment', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderTable()

    await user.click(screen.getByTestId('add-line-P1'))
    await user.click(screen.getAllByRole('option', { name: /PLA White/ })[0])
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(4000)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('abandons a draft row', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByTestId('add-line-P1'))
    await user.click(within(screen.getByTestId('piece-item-draft-P1')).getByRole('button'))

    expect(screen.queryByTestId('piece-item-draft-P1')).not.toBeInTheDocument()
    expect(world.em.pieceItems.findActiveByPiece('P1')).toHaveLength(1)
  })

  it('deletes a line', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable('P1', onChanged)

    await user.click(screen.getByTestId('piece-item-delete-PI1'))

    expect(world.em.pieceItems.find('PI1')?.isDeleted()).toBe(true)
    expect(screen.getByText('No material lines yet.')).toBeInTheDocument()
    expect(onChanged).toHaveBeenCalled()
  })

  it('toasts when deleting a line that already vanished', async () => {
    const user = userEvent.setup()
    renderTable()

    world.em.pieceItems.remove('PI1')
    await user.click(screen.getByTestId('piece-item-delete-PI1'))

    expect(toastMock.error).toHaveBeenCalledWith('Action failed. Please try again.')
  })

  it('renders a line with no stored quantity as blank and costs it as zero', () => {
    world.tabs.seed('piece_items', [
      { id: 'PI2', piece_id: 'P1', inventory_id: 'INV2' },
    ])
    renderTable()

    const row = screen.getByTestId('piece-item-row-PI2')
    expect(screen.getByTestId('piece-item-qty-PI2')).toHaveValue(null)
    // 0 × €1/unit; nothing needed, so the run is trivially safe.
    expect(within(row).getByText('€0.00')).toBeInTheDocument()
    expect(within(row).getByText(/Safe/)).toBeInTheDocument()
  })

  it('treats a line onto vanished inventory as out of stock', () => {
    world.tabs.seed('piece_items', [
      { id: 'PI2', piece_id: 'P1', inventory_id: 'INV404', quantity: '10' },
    ])
    renderTable()

    const row = screen.getByTestId('piece-item-row-PI2')
    // No lots resolve, so no cost; zero stock against a 20g need is risky.
    expect(within(row).getByText('—')).toBeInTheDocument()
    expect(within(row).getByText('Risky (no redo margin)')).toBeInTheDocument()
  })

  it('flags a line whose stock covers exactly one redo as tight', () => {
    // 10 nozzles against 2 × 2 units needed: one spare run, no more.
    world.tabs.seed('piece_items', [
      { id: 'PI2', piece_id: 'P1', inventory_id: 'INV2', quantity: '2' },
    ])
    renderTable()

    const row = screen.getByTestId('piece-item-row-PI2')
    expect(within(row).getByText('Tight (1 redo)')).toBeInTheDocument()
  })

  it('treats a piece with unset units as a single unit for costing', () => {
    world.em.pieceItems.save(
      Object.assign(world.em.pieceItems.find('PI1') as never, { id: 'PI2', pieceId: 'P2' })
    )
    renderTable('P2')

    // 10g × 1 unit × €0.02/g.
    const row = screen.getByTestId('piece-item-row-PI2')
    expect(within(row).getByText('€0.20')).toBeInTheDocument()
  })
})
