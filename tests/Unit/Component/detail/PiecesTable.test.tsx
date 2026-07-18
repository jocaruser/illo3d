import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PiecesTable } from '@/Component/detail/PiecesTable'
import type { Piece } from '@/Entity/Piece'
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
 * P1 "Shell": €21 × 2 units, 10g PLA (INV1, 900g @ €0.02/g) + 1 Nozzle (INV2, 3 @ €5).
 * P2 "Arm": unpriced, unset units, no material lines.
 * P3 "Base": 1 unit, one line on INV4, which has no lots (so no suggestion).
 */
function seedWorld(): TestWorld {
  return createWorld({
    jobs: [{ id: 'J1', client_id: 'CL1', description: 'Phone case', status: 'draft', created_at: '2024-05-01T09:00:00.000Z' }],
    pieces: [
      { id: 'P1', job_id: 'J1', name: 'Shell', status: 'pending', price: '21', units: '2', created_at: '2024-05-01T10:00:00.000Z' },
      { id: 'P2', job_id: 'J1', name: 'Arm', status: 'pending', created_at: '2024-05-01T11:00:00.000Z' },
      { id: 'P3', job_id: 'J1', name: 'Base', status: 'pending', units: '1', created_at: '2024-05-01T12:00:00.000Z' },
    ],
    piece_items: [
      { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '10' },
      { id: 'PI2', piece_id: 'P1', inventory_id: 'INV2', quantity: '1' },
      { id: 'PI3', piece_id: 'P3', inventory_id: 'INV4', quantity: '1' },
    ],
    inventory: [
      { id: 'INV1', type: 'filament', name: 'PLA White', qty_current: '900', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV2', type: 'consumable', name: 'Nozzle', qty_current: '3', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV3', type: 'filament', name: 'PLA Black', qty_current: '5', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'INV4', type: 'consumable', name: 'Glue', qty_current: '9', created_at: '2024-01-01T00:00:00.000Z' },
    ],
    lots: [
      { id: 'L1', inventory_id: 'INV1', transaction_id: 'T9', quantity: '1000', amount: '20', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'L2', inventory_id: 'INV2', transaction_id: 'T9', quantity: '2', amount: '10', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'L3', inventory_id: 'INV3', transaction_id: 'T9', quantity: '10', amount: '1', created_at: '2024-01-01T00:00:00.000Z' },
    ],
  })
}

function pieces(): Piece[] {
  return world.em.pieces.findByJob('J1')
}

function renderTable(onChanged = vi.fn()) {
  return renderWithProviders(
    <PiecesTable rows={pieces()} emptyMessage="No pieces yet." onChanged={onChanged} />
  )
}

function statusBox(pieceId: string): HTMLElement {
  return within(screen.getByTestId(`piece-status-${pieceId}`)).getByRole('combobox')
}

beforeEach(() => {
  world = seedWorld()
  window.location.hash = ''
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('PiecesTable', () => {
  it('shows the in-table empty message', () => {
    renderWithProviders(<PiecesTable rows={[]} emptyMessage="No pieces yet." onChanged={vi.fn()} />)
    expect(screen.getByText('No pieces yet.')).toBeInTheDocument()
  })

  it('shows the line total and benefit of a priced piece', () => {
    renderTable()

    const row = screen.getByTestId('piece-name-P1').closest('tr') as HTMLElement
    // €21 × 2 units.
    expect(within(row).getByText('€42.00')).toBeInTheDocument()
    // €42 − (10g × €0.02 + 1 × €5) × 2 units.
    expect(within(row).getByText('€31.60')).toBeInTheDocument()
  })

  it('dashes the line total and benefit of an unpriced piece', () => {
    renderTable()
    const row = screen.getByTestId('piece-name-P2').closest('tr') as HTMLElement
    expect(within(row).getAllByText('—')).toHaveLength(2)
  })

  it('highlights an unset units cell in amber', () => {
    renderTable()

    const unset = screen.getByTestId('piece-units-P2')
    expect(unset).toHaveClass('border-warning')
    expect(unset).toHaveAttribute('title', 'Set a units count for this piece')
    expect(screen.getByTestId('piece-units-P1')).not.toHaveClass('border-warning')
  })

  it('renames a piece on blur', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable(onChanged)

    const name = screen.getByTestId('piece-name-P1')
    await user.clear(name)
    await user.type(name, 'Top shell')
    await user.tab()

    expect(world.em.pieces.find('P1')?.name).toBe('Top shell')
    expect(onChanged).toHaveBeenCalled()
  })

  it('rejects an empty name and keeps the stored one', async () => {
    const user = userEvent.setup()
    renderTable()

    const name = screen.getByTestId('piece-name-P1')
    await user.clear(name)
    await user.tab()

    expect(toastMock.error).toHaveBeenCalledWith('Name is required')
    expect(world.em.pieces.find('P1')?.name).toBe('Shell')
  })

  it('skips the save when the name is unchanged', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable(onChanged)

    await user.click(screen.getByTestId('piece-name-P1'))
    await user.tab()

    expect(onChanged).not.toHaveBeenCalled()
  })

  it('sets the units on blur', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.type(screen.getByTestId('piece-units-P2'), '4')
    await user.tab()

    expect(world.em.pieces.find('P2')?.units).toBe(4)
  })

  it.each([
    ['2.5', 'non-integer'],
    ['0', 'zero'],
    ['-1', 'negative'],
  ])('rejects %s units (%s)', async (value) => {
    const user = userEvent.setup()
    renderTable()

    const units = screen.getByTestId('piece-units-P1')
    await user.clear(units)
    await user.type(units, value)
    await user.tab()

    expect(toastMock.error).toHaveBeenCalledWith(
      'Set a positive units count on this piece before marking it done or failed.'
    )
    expect(world.em.pieces.find('P1')?.units).toBe(2)
  })

  it('ignores a blank or unchanged units edit', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable(onChanged)

    const units = screen.getByTestId('piece-units-P1')
    await user.clear(units)
    await user.tab()
    expect(onChanged).not.toHaveBeenCalled()

    await user.type(screen.getByTestId('piece-units-P1'), '2')
    await user.tab()
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('sets the price on blur', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.type(screen.getByTestId('piece-price-P2'), '9.5')
    await user.tab()

    expect(world.em.pieces.find('P2')?.price).toBe(9.5)
  })

  it('rejects a negative price', async () => {
    const user = userEvent.setup()
    renderTable()

    const price = screen.getByTestId('piece-price-P1')
    await user.clear(price)
    await user.type(price, '-3')
    await user.tab()

    expect(toastMock.error).toHaveBeenCalledWith('Enter a valid price (0 or greater)')
    expect(world.em.pieces.find('P1')?.price).toBe(21)
  })

  it('ignores a blank or unchanged price edit', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    renderTable(onChanged)

    const price = screen.getByTestId('piece-price-P1')
    await user.clear(price)
    await user.tab()
    expect(onChanged).not.toHaveBeenCalled()

    await user.type(screen.getByTestId('piece-price-P1'), '21')
    await user.tab()
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('applies the suggested price of materials × 3', async () => {
    const user = userEvent.setup()
    renderTable()

    // (10g × €0.02 + 1 × €5) × 3.
    const apply = screen.getByTestId('piece-suggested-P1')
    expect(apply).toHaveTextContent('€15.60')
    await user.click(apply)

    expect(world.em.pieces.find('P1')?.price).toBe(15.6)
  })

  it('disables the suggestion when an inventory item has no purchase data', () => {
    renderTable()

    const apply = screen.getByTestId('piece-suggested-P3')
    expect(apply).toBeDisabled()
    expect(apply).toHaveTextContent('No suggested price available')
    expect(apply).toHaveAttribute('title', expect.stringContaining('INV4'))
  })

  it('suppresses the suggestion for a piece with no material lines', () => {
    renderTable()
    // No "Use €0.00" button: with no lines there is nothing to suggest.
    expect(screen.queryByTestId('piece-suggested-P2')).not.toBeInTheDocument()
  })

  it('expands a piece to reveal its material lines, and collapses it again', async () => {
    const user = userEvent.setup()
    renderTable()

    expect(screen.queryByTestId('piece-item-row-PI1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand piece P1' }))
    expect(screen.getByTestId('piece-item-row-PI1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Collapse piece P1' }))
    expect(screen.queryByTestId('piece-item-row-PI1')).not.toBeInTheDocument()
  })

  it('keeps several pieces expanded at once', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: 'Expand piece P1' }))
    await user.click(screen.getByRole('button', { name: 'Expand piece P3' }))

    expect(screen.getByTestId('piece-item-row-PI1')).toBeInTheDocument()
    expect(screen.getByTestId('piece-item-row-PI3')).toBeInTheDocument()
  })

  it('shows the run margin of an expanded piece', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: 'Expand piece P1' }))
    // 3 nozzles against 2 needed is the tightest line: no redo margin.
    expect(screen.getByText(/Run stock: Risky/)).toBeInTheDocument()
  })

  it('shows a tight run margin when the stock covers exactly one redo', async () => {
    const user = userEvent.setup()
    // 2 glue sticks against 1 needed per run: one spare run only.
    const glue = world.em.inventory.find('INV4')
    if (glue !== null) {
      glue.qtyCurrent = 2
      world.em.inventory.save(glue)
    }
    renderTable()

    await user.click(screen.getByRole('button', { name: 'Expand piece P3' }))
    expect(screen.getByText(/Run stock: Tight \(1 redo\)/)).toBeInTheDocument()
  })

  it('prices the benefit of a piece whose only line has no purchase data', () => {
    // P3's glue has no lots: the material cost contribution is simply unknown,
    // so the benefit falls back to the full line total.
    const piece = world.em.pieces.find('P3')
    if (piece !== null) {
      piece.price = 10
      world.em.pieces.save(piece)
    }
    renderTable()

    const row = screen.getByTestId('piece-name-P3').closest('tr') as HTMLElement
    expect(within(row).getAllByText('€10.00').length).toBeGreaterThan(0)
  })

  it('ranks a line onto vanished inventory or with no quantity as zero stock', async () => {
    const user = userEvent.setup()
    // Third line on P1: unknown inventory and no quantity at all. It must not
    // crash the margin maths, and P1 keeps a risky margin.
    world.tabs.seed('piece_items', [
      { id: 'PI9', piece_id: 'P1', inventory_id: 'INV404' },
    ])
    renderTable()

    await user.click(screen.getByRole('button', { name: 'Expand piece P1' }))
    expect(screen.getByText(/Run stock: Risky/)).toBeInTheDocument()
  })

  it('omits the run margin for a piece with no lines', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: 'Expand piece P2' }))
    expect(screen.queryByText(/Run stock:/)).not.toBeInTheDocument()
  })

  it('auto-expands and scrolls to the piece named in the hash', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    window.location.hash = '#piece-P1'
    renderTable()

    expect(screen.getByTestId('piece-item-row-PI1')).toBeInTheDocument()
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
  })

  it('ignores a hash that names no piece', () => {
    window.location.hash = '#somewhere-else'
    renderTable()
    expect(screen.queryByTestId('piece-item-row-PI1')).not.toBeInTheDocument()
  })

  it.each([
    ['id', 'ID', ['P1', 'P2', 'P3']],
    ['name', 'Name', ['P2', 'P3', 'P1']],
    ['units', 'Units', ['P3', 'P1', 'P2']],
    ['price', 'Price / unit', ['P1', 'P2', 'P3']],
    ['lineTotal', 'Line total', ['P1', 'P2', 'P3']],
    ['status', 'Status', ['P1', 'P2', 'P3']],
    ['createdAt', 'Created', ['P1', 'P2', 'P3']],
  ])('sorts by %s', async (_key, label, expected) => {
    const user = userEvent.setup()
    renderTable()

    const button =
      label === 'ID'
        ? screen.getByRole('button', { name: 'ID, sorted ascending' })
        : screen.getByRole('button', { name: `Sort by ${label}` })
    await user.click(button)
    if (label === 'ID') await user.click(screen.getByRole('button', { name: 'ID, sorted descending' }))

    const ids = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[1].textContent)
    expect(ids).toEqual(expected)
  })

  describe('children are history', () => {
    const flag = (
      id: string,
      patch: { archived?: string; deleted?: string }
    ) => {
      const piece = world.em.pieces.find(id)
      if (piece !== null) {
        Object.assign(piece, patch)
        world.em.pieces.save(piece)
      }
    }

    it('strikes an archived piece through and renders it read-only', () => {
      flag('P1', { archived: 'true' })
      renderTable()

      expect(screen.queryByTestId('piece-name-P1')).not.toBeInTheDocument()
      const name = screen.getByTestId('piece-name-text-P1')
      expect(name).toHaveTextContent('Shell')
      expect(name.closest('td')).toHaveClass('line-through')
      expect(screen.queryByTestId('expand-piece-P1')).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('piece-suggested-P1')
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId('piece-status-P1')).not.toBeInTheDocument()

      // Units, price and status render as plain figures.
      const row = name.closest('tr') as HTMLElement
      expect(within(row).getByText('2')).toBeInTheDocument()
      expect(within(row).getByText('€21.00')).toBeInTheDocument()
      expect(within(row).getByText('Pending')).toBeInTheDocument()
    })

    it('un-archives a piece from its row', async () => {
      const onChanged = vi.fn()
      const user = userEvent.setup()
      flag('P1', { archived: 'true' })
      renderTable(onChanged)

      await user.click(screen.getByTestId('piece-unarchive-P1'))

      expect(world.em.pieces.find('P1')?.isActive()).toBe(true)
      expect(onChanged).toHaveBeenCalled()
      expect(toastMock.success).toHaveBeenCalledWith(
        'Change applied — save to persist it'
      )
    })

    it('labels a soft-deleted piece as a deleted entity with no actions', () => {
      flag('P2', { deleted: 'true' })
      renderTable()

      expect(screen.getByTestId('piece-deleted-P2')).toHaveTextContent(
        'Deleted entity'
      )
      expect(
        screen.queryByTestId('piece-unarchive-P2')
      ).not.toBeInTheDocument()
      const row = screen
        .getByTestId('piece-name-text-P2')
        .closest('tr') as HTMLElement
      // P2 has no units and no price: both figures dash alongside the totals.
      expect(within(row).getAllByText('—').length).toBeGreaterThanOrEqual(2)
    })

    it('ignores a deep link into an archived piece', () => {
      window.location.hash = '#piece-P1'
      flag('P1', { archived: 'true' })
      renderTable()
      expect(screen.queryByTestId('piece-item-row-PI1')).not.toBeInTheDocument()
    })
  })

  describe('read-only mode', () => {
    it('renders even active pieces as text on an archived job page', () => {
      renderWithProviders(
        <PiecesTable
          rows={pieces()}
          emptyMessage="No pieces yet."
          readOnly
          onChanged={vi.fn()}
        />
      )

      expect(screen.queryByTestId('piece-name-P1')).not.toBeInTheDocument()
      const name = screen.getByTestId('piece-name-text-P1')
      expect(name).toHaveTextContent('Shell')
      // The piece itself is active, so nothing is struck through.
      expect(name.closest('td')).not.toHaveClass('line-through')
      expect(screen.queryByTestId('expand-piece-P1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('piece-status-P1')).not.toBeInTheDocument()
      const row = name.closest('tr') as HTMLElement
      expect(within(row).getByText('Pending')).toBeInTheDocument()
      expect(
        within(row).queryByTestId('piece-unarchive-P1')
      ).not.toBeInTheDocument()
    })
  })

  describe('status flow', () => {
    it('blocks done when the piece has no material line', async () => {
      const user = userEvent.setup()
      renderTable()

      await user.click(statusBox('P2'))
      await user.click(screen.getByRole('option', { name: 'Done' }))

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Add at least one material line before marking this piece done or failed.'
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(world.em.pieces.find('P2')?.status).toBe('pending')
    })

    it('blocks done when the units are unset', async () => {
      const user = userEvent.setup()
      world.em.pieceItems.save(
        Object.assign(world.em.pieceItems.find('PI1') as never, { id: 'PI9', pieceId: 'P2' })
      )
      renderTable()

      await user.click(statusBox('P2'))
      await user.click(screen.getByRole('option', { name: 'Done' }))

      expect(screen.getByRole('alert')).toHaveTextContent('Set a positive units count')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('completes a piece and decrements inventory by default', async () => {
      const user = userEvent.setup()
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Done' }))

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByRole('heading', { name: 'Complete piece' })).toBeInTheDocument()
      expect(within(dialog).getByRole('checkbox')).toBeChecked()
      await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))

      expect(world.em.pieces.find('P1')?.status).toBe('done')
      // 900g − 10g × 2 units, and 3 − 1 × 2.
      expect(world.em.inventory.find('INV1')?.qtyCurrent).toBe(880)
      expect(world.em.inventory.find('INV2')?.qtyCurrent).toBe(1)
    })

    it('completes a piece without touching inventory when unchecked', async () => {
      const user = userEvent.setup()
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Failed' }))
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(world.em.pieces.find('P1')?.status).toBe('failed')
      expect(world.em.inventory.find('INV1')?.qtyCurrent).toBe(900)
    })

    it('lists the shortfall but still allows confirming without the decrement', async () => {
      const user = userEvent.setup()
      // Two units need 2 nozzles but only 1 is left.
      const nozzle = world.em.inventory.find('INV2')
      if (nozzle !== null) {
        nozzle.qtyCurrent = 1
        world.em.inventory.save(nozzle)
      }
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Done' }))

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText(/Some lots do not have enough quantity/)).toBeInTheDocument()
      expect(within(dialog).getByText('Nozzle: need 2, have 1')).toBeInTheDocument()

      // Confirming with the decrement still checked is refused by the service.
      await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))
      expect(within(dialog).getByRole('alert')).toHaveTextContent('Could not decrement')
      expect(world.em.pieces.find('P1')?.status).toBe('pending')

      await user.click(within(dialog).getByRole('checkbox'))
      await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))
      expect(world.em.pieces.find('P1')?.status).toBe('done')
    })

    it('lists a vanished inventory item by id in the shortfall and skips unquantified lines', async () => {
      const user = userEvent.setup()
      world.tabs.seed('piece_items', [
        // Unknown inventory: zero on hand, so it must appear in the warning.
        { id: 'PI8', piece_id: 'P1', inventory_id: 'INV404', quantity: '1' },
        // No quantity: nothing to reserve, so it must not appear at all.
        { id: 'PI9', piece_id: 'P1', inventory_id: 'INV3' },
      ])
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Done' }))

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText('INV404: need 2, have 0')).toBeInTheDocument()
      expect(within(dialog).queryByText(/INV3/)).not.toBeInTheDocument()
    })

    it('surfaces a service refusal that carries no shortfall detail', async () => {
      const user = userEvent.setup()
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Done' }))

      // The lines vanish (say, in another tab) between opening and confirming.
      world.em.pieceItems.remove('PI1')
      world.em.pieceItems.remove('PI2')
      await user.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Add at least one material line'
      )
      expect(world.em.pieces.find('P1')?.status).toBe('pending')
    })

    it('cancels a status change', async () => {
      const user = userEvent.setup()
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Done' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(world.em.pieces.find('P1')?.status).toBe('pending')
    })

    it('restores inventory when reverting to pending', async () => {
      const user = userEvent.setup()
      const piece = world.em.pieces.find('P1')
      if (piece !== null) {
        piece.status = 'done'
        world.em.pieces.save(piece)
      }
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Pending' }))

      const dialog = screen.getByRole('dialog')
      expect(
        within(dialog).getByRole('heading', { name: 'Revert piece status' })
      ).toBeInTheDocument()
      expect(within(dialog).getByRole('checkbox')).toBeChecked()
      await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))

      expect(world.em.pieces.find('P1')?.status).toBe('pending')
      expect(world.em.inventory.find('INV1')?.qtyCurrent).toBe(920)
    })

    it('reverts without restoring when unchecked', async () => {
      const user = userEvent.setup()
      const piece = world.em.pieces.find('P1')
      if (piece !== null) {
        piece.status = 'done'
        world.em.pieces.save(piece)
      }
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Pending' }))
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(world.em.pieces.find('P1')?.status).toBe('pending')
      expect(world.em.inventory.find('INV1')?.qtyCurrent).toBe(900)
    })

    it('moves between two consuming statuses without a dialog', async () => {
      const user = userEvent.setup()
      const piece = world.em.pieces.find('P1')
      if (piece !== null) {
        piece.status = 'done'
        world.em.pieces.save(piece)
      }
      renderTable()

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Failed' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(world.em.pieces.find('P1')?.status).toBe('failed')
      expect(world.em.inventory.find('INV1')?.qtyCurrent).toBe(900)
    })

    it('ignores picking the status the piece already has', async () => {
      const onChanged = vi.fn()
      const user = userEvent.setup()
      renderTable(onChanged)

      await user.click(statusBox('P1'))
      await user.click(screen.getByRole('option', { name: 'Pending' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(onChanged).not.toHaveBeenCalled()
    })
  })
})
