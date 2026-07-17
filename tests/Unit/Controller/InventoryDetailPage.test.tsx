import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InventoryDetailPage } from '@/Controller/InventoryDetailPage'
import type { EntityManager } from '@/Repository/EntityManager'
import { createTestEm, FakeTabs, renderRoute } from '../helpers/workbookTestBed'

const mocks = vi.hoisted(() => ({
  em: null as unknown as EntityManager,
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))
vi.mock('@/Component/Toast', () => ({ toast: mocks.toast }))

let tabs: FakeTabs

function seedWorkbook(): FakeTabs {
  const seeded = new FakeTabs()
  seeded.seed('inventory', {
    id: 'INV1',
    type: 'filament',
    name: 'PLA White',
    qty_current: '800',
    warn_yellow: '300',
    warn_orange: '200',
    warn_red: '100',
    created_at: '2026-01-02T00:00:00.000Z',
    colour: '#ff0000',
  })
  seeded.seed('transactions', {
    id: 'T11',
    type: 'expense',
    concept: 'PLA White restock',
    amount: '-20',
  })
  seeded.seed('lots', {
    id: 'L1',
    inventory_id: 'INV1',
    transaction_id: 'T11',
    quantity: '1000',
    amount: '20',
    created_at: '2026-01-02T00:00:00.000Z',
  })
  seeded.seed('jobs', {
    id: 'J1',
    client_id: 'CL1',
    description: 'Prototype batch',
  })
  seeded.seed('pieces', { id: 'P1', job_id: 'J1', name: 'Alpha bracket' })
  seeded.seed('piece_items', {
    id: 'PI1',
    piece_id: 'P1',
    inventory_id: 'INV1',
    quantity: '250',
  })
  return seeded
}

function renderDetail(id = 'INV1') {
  return renderRoute(<InventoryDetailPage />, {
    path: '/inventory/:inventoryId',
    entry: `/inventory/${id}`,
  })
}

/** Re-reads a row straight from the snapshot, bypassing the UI. */
function inventoryRow(id: string) {
  return createTestEm(tabs).inventory.find(id)
}

describe('InventoryDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tabs = seedWorkbook()
    mocks.em = createTestEm(tabs)
  })

  describe('routing', () => {
    it('shows the item with its identity fields', () => {
      renderDetail()

      expect(
        screen.getByRole('heading', { name: 'PLA White' })
      ).toBeInTheDocument()
      expect(screen.getByText('INV1')).toBeInTheDocument()
      expect(screen.getByText('Filament')).toBeInTheDocument()
      expect(screen.getByText('€0.02')).toBeInTheDocument()
    })

    it('dashes the average cost when the item has no lots', () => {
      tabs = new FakeTabs()
      tabs.seed('inventory', { id: 'INV9', type: 'consumable', name: 'Glue' })
      mocks.em = createTestEm(tabs)
      renderDetail('INV9')

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('offers a way back when the id is unknown', () => {
      renderDetail('NOPE')

      expect(
        screen.getByText('No inventory item with this id.')
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'Back to inventory' })
      ).toHaveAttribute('href', '/inventory')
    })

    it.each([
      ['archived', { archived: 'true' }],
      ['soft-deleted', { deleted: 'true' }],
    ])('treats an %s item as not found', (_label, lifecycle) => {
      tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV9',
        type: 'consumable',
        name: 'Gone',
        ...lifecycle,
      })
      mocks.em = createTestEm(tabs)
      renderDetail('INV9')

      expect(
        screen.getByText('No inventory item with this id.')
      ).toBeInTheDocument()
    })
  })

  describe('QtyEditor', () => {
    it('saves a corrected count, rounded to two decimals', async () => {
      const user = userEvent.setup()
      renderDetail()

      const input = screen.getByTestId('inventory-detail-qty-current')
      expect(input).toHaveValue(800)

      await user.clear(input)
      await user.type(input, '900.567')
      await user.click(screen.getByTestId('inventory-detail-save-qty'))

      expect(inventoryRow('INV1')?.qtyCurrent).toBe(900.57)
      expect(input).toHaveValue(900.57)
      expect(mocks.toast.success).toHaveBeenCalledWith('Change applied — save to persist it')
    })

    it('rejects a negative count', async () => {
      const user = userEvent.setup()
      renderDetail()

      await user.clear(screen.getByTestId('inventory-detail-qty-current'))
      await user.type(screen.getByTestId('inventory-detail-qty-current'), '-5')
      await user.click(screen.getByTestId('inventory-detail-save-qty'))

      expect(screen.getByRole('alert')).toHaveTextContent(/non-negative/)
      expect(inventoryRow('INV1')?.qtyCurrent).toBe(800)
      expect(mocks.toast.error).toHaveBeenCalled()
    })

    it('rejects a blank count', async () => {
      const user = userEvent.setup()
      renderDetail()

      await user.clear(screen.getByTestId('inventory-detail-qty-current'))
      await user.click(screen.getByTestId('inventory-detail-save-qty'))

      expect(screen.getByRole('alert')).toHaveTextContent(/non-negative/)
      expect(inventoryRow('INV1')?.qtyCurrent).toBe(800)
    })
  })

  describe('ThresholdEditor', () => {
    it('saves all three tiers', async () => {
      const user = userEvent.setup()
      renderDetail()

      for (const [tier, value] of [
        ['yellow', '10'],
        ['orange', '5'],
        ['red', '1'],
      ]) {
        const input = screen.getByTestId(`inventory-detail-warn-${tier}`)
        await user.clear(input)
        await user.type(input, value)
      }
      await user.click(screen.getByTestId('inventory-detail-save-thresholds'))

      const item = inventoryRow('INV1')
      expect([item?.warnYellow, item?.warnOrange, item?.warnRed]).toEqual([
        10, 5, 1,
      ])
      expect(mocks.toast.success).toHaveBeenCalled()
    })

    it.each([
      ['a fractional tier', '2.5'],
      ['a negative tier', '-1'],
      ['a blank tier', ''],
    ])('rejects %s', async (_label, value) => {
      const user = userEvent.setup()
      renderDetail()

      const input = screen.getByTestId('inventory-detail-warn-red')
      await user.clear(input)
      if (value !== '') await user.type(input, value)
      await user.click(screen.getByTestId('inventory-detail-save-thresholds'))

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not save thresholds.'
      )
      expect(inventoryRow('INV1')?.warnRed).toBe(100)
    })

    it('rejects blank yellow and orange tiers too', async () => {
      const user = userEvent.setup()
      renderDetail()

      await user.clear(screen.getByTestId('inventory-detail-warn-yellow'))
      await user.clear(screen.getByTestId('inventory-detail-warn-orange'))
      await user.click(screen.getByTestId('inventory-detail-save-thresholds'))

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not save thresholds.'
      )
      const item = inventoryRow('INV1')
      expect([item?.warnYellow, item?.warnOrange]).toEqual([300, 200])
    })
  })

  describe('ColourEditor', () => {
    it('starts from the stored colour and saves a new one from the picker', async () => {
      const user = userEvent.setup()
      renderDetail()

      expect(screen.getByTestId('inventory-detail-colour-hex')).toHaveValue(
        '#ff0000'
      )
      expect(screen.getByTestId('inventory-detail-colour-picker')).toHaveValue(
        '#ff0000'
      )

      const hex = screen.getByTestId('inventory-detail-colour-hex')
      await user.clear(hex)
      await user.type(hex, '#00ff00')
      await user.click(screen.getByTestId('inventory-detail-save-colour'))

      expect(inventoryRow('INV1')?.colour).toBe('#00ff00')
      expect(mocks.toast.success).toHaveBeenCalled()
    })

    it('clears the swatch', async () => {
      const user = userEvent.setup()
      renderDetail()

      await user.click(screen.getByTestId('inventory-detail-clear-colour'))
      expect(screen.getByTestId('inventory-detail-colour-hex')).toHaveValue('')
      // With no colour the picker falls back to black rather than going blank.
      expect(screen.getByTestId('inventory-detail-colour-picker')).toHaveValue(
        '#000000'
      )

      await user.click(screen.getByTestId('inventory-detail-save-colour'))
      expect(inventoryRow('INV1')?.colour).toBe('')
    })

    it('mirrors a colour chosen in the picker into the hex field', () => {
      renderDetail()

      fireEvent.change(screen.getByTestId('inventory-detail-colour-picker'), {
        target: { value: '#123456' },
      })

      expect(screen.getByTestId('inventory-detail-colour-hex')).toHaveValue(
        '#123456'
      )
      // Picking alone saves nothing yet.
      expect(inventoryRow('INV1')?.colour).toBe('#ff0000')
    })

    it('rejects a hex that is not #RRGGBB', async () => {
      const user = userEvent.setup()
      renderDetail()

      const hex = screen.getByTestId('inventory-detail-colour-hex')
      await user.clear(hex)
      await user.type(hex, 'red')
      await user.click(screen.getByTestId('inventory-detail-save-colour'))

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Enter a colour as #RRGGBB, or clear it.'
      )
      expect(inventoryRow('INV1')?.colour).toBe('#ff0000')
      expect(mocks.toast.error).toHaveBeenCalled()
    })
  })

  describe('purchase lots', () => {
    it('shows a lot with its transaction concept linked', () => {
      renderDetail()

      expect(
        screen.getByRole('heading', { name: 'Purchase lots' })
      ).toBeInTheDocument()
      const link = screen.getByTestId('inventory-lot-tx-L1')
      expect(link).toHaveTextContent('PLA White restock')
      expect(link).toHaveAttribute('href', '/transactions/T11')
    })

    it('falls back to the transaction id when the transaction is gone', () => {
      tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV1',
        type: 'filament',
        name: 'PLA White',
      })
      tabs.seed('lots', {
        id: 'L1',
        inventory_id: 'INV1',
        transaction_id: 'T404',
        quantity: '1',
        amount: '1',
      })
      mocks.em = createTestEm(tabs)
      renderDetail()

      expect(screen.getByTestId('inventory-lot-tx-L1')).toHaveTextContent(
        'T404'
      )
    })

    it('saves an edited lot', async () => {
      const user = userEvent.setup()
      renderDetail()

      const qty = screen.getByTestId('inventory-detail-lot-qty-L1')
      await user.clear(qty)
      await user.type(qty, '1200')
      await user.click(screen.getByTestId('inventory-detail-save-lot-L1'))

      expect(createTestEm(tabs).lots.find('L1')?.quantity).toBe(1200)
      expect(mocks.toast.success).toHaveBeenCalled()
    })

    it('rejects a non-positive lot quantity', async () => {
      const user = userEvent.setup()
      renderDetail()

      const qty = screen.getByTestId('inventory-detail-lot-qty-L1')
      await user.clear(qty)
      await user.type(qty, '0')
      await user.click(screen.getByTestId('inventory-detail-save-lot-L1'))

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Enter a positive quantity for this lot.'
      )
      expect(createTestEm(tabs).lots.find('L1')?.quantity).toBe(1000)
    })

    it('rejects a negative lot amount but allows zero', async () => {
      const user = userEvent.setup()
      renderDetail()

      const amount = screen.getByTestId('inventory-detail-lot-amount-L1')
      await user.clear(amount)
      await user.type(amount, '-1')
      await user.click(screen.getByTestId('inventory-detail-save-lot-L1'))
      expect(screen.getByRole('alert')).toHaveTextContent(/non-negative amount/)

      await user.clear(amount)
      await user.type(amount, '0')
      await user.click(screen.getByTestId('inventory-detail-save-lot-L1'))
      expect(createTestEm(tabs).lots.find('L1')?.amount).toBe(0)
    })

    it('shows its own empty row while the page still renders the section', () => {
      tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV1',
        type: 'filament',
        name: 'PLA White',
      })
      mocks.em = createTestEm(tabs)
      renderDetail()

      expect(
        screen.getByRole('heading', { name: 'Purchase lots' })
      ).toBeInTheDocument()
      expect(screen.getByText('No purchase lots yet.')).toBeInTheDocument()
    })

    it('starts blank for a lot with no stored figures and refuses to save it as-is', async () => {
      const user = userEvent.setup()
      tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV1',
        type: 'filament',
        name: 'PLA White',
      })
      // A legacy row can miss both figures; the editor must not invent zeros.
      tabs.seed('lots', {
        id: 'L1',
        inventory_id: 'INV1',
        transaction_id: 'T11',
      })
      mocks.em = createTestEm(tabs)
      renderDetail()

      expect(screen.getByTestId('inventory-detail-lot-qty-L1')).toHaveValue(null)
      expect(screen.getByTestId('inventory-detail-lot-amount-L1')).toHaveValue(null)

      await user.click(screen.getByTestId('inventory-detail-save-lot-L1'))

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Enter a positive quantity for this lot.'
      )
      expect(mocks.toast.error).toHaveBeenCalledWith('Could not save lot.')
      expect(createTestEm(tabs).lots.find('L1')?.quantity).toBeUndefined()
    })
  })

  describe('consumption', () => {
    it('joins the bill-of-materials line through its piece to the job', () => {
      renderDetail()

      expect(
        screen.getByRole('heading', { name: 'Consumption' })
      ).toBeInTheDocument()
      const row = within(screen.getAllByRole('table')[1]).getAllByRole('row')[1]
      expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('250')
      expect(within(row).getAllByRole('cell')[1]).toHaveTextContent(
        'Alpha bracket'
      )
      expect(
        screen.getByTestId('inventory-consumption-job-PI1')
      ).toHaveAttribute('href', '/jobs/J1')
    })

    it('falls back to the piece id and drops the link when the join breaks', () => {
      tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV1',
        type: 'filament',
        name: 'PLA White',
      })
      tabs.seed('piece_items', {
        id: 'PI9',
        piece_id: 'P404',
        inventory_id: 'INV1',
        quantity: '',
      })
      mocks.em = createTestEm(tabs)
      renderDetail()

      expect(screen.getByText('P404')).toBeInTheDocument()
      expect(
        screen.queryByTestId('inventory-consumption-job-PI9')
      ).not.toBeInTheDocument()
    })

    it('drops the link when the piece survives but its job does not', () => {
      tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV1',
        type: 'filament',
        name: 'PLA White',
      })
      tabs.seed('pieces', { id: 'P1', job_id: 'J404', name: 'Orphan piece' })
      tabs.seed('piece_items', {
        id: 'PI9',
        piece_id: 'P1',
        inventory_id: 'INV1',
        quantity: '5',
      })
      mocks.em = createTestEm(tabs)
      renderDetail()

      expect(screen.getByText('Orphan piece')).toBeInTheDocument()
      expect(
        screen.queryByTestId('inventory-consumption-job-PI9')
      ).not.toBeInTheDocument()
    })

    it('shows its own empty row while the page still renders the section', () => {
      tabs = new FakeTabs()
      tabs.seed('inventory', {
        id: 'INV1',
        type: 'filament',
        name: 'PLA White',
      })
      mocks.em = createTestEm(tabs)
      renderDetail()

      expect(
        screen.getByText('No consumption recorded for this material yet.')
      ).toBeInTheDocument()
    })
  })

  describe('archiving', () => {
    it('archives the item and its lots, then returns to the list', async () => {
      const user = userEvent.setup()
      renderDetail()

      await user.click(screen.getByTestId('entity-detail-delete'))
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Archive',
        })
      )

      const after = createTestEm(tabs)
      expect(after.inventory.find('INV1')?.isArchived()).toBe(true)
      expect(after.lots.find('L1')?.isArchived()).toBe(true)
      expect(screen.getByTestId('location')).toHaveTextContent('/inventory')
    })

    it('leaves everything alone when the confirm is dismissed', async () => {
      const user = userEvent.setup()
      renderDetail()

      await user.click(screen.getByTestId('entity-detail-delete'))
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Cancel',
        })
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(createTestEm(tabs).inventory.find('INV1')?.isArchived()).toBe(
        false
      )
    })
  })
})
