import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatePurchaseDialog } from '@/Component/detail/CreatePurchaseDialog'
import type { EntityManager } from '@/Repository/EntityManager'
import {
  createTestEm,
  FakeTabs,
  renderRoute,
} from '../../helpers/workbookTestBed'

const mocks = vi.hoisted(() => ({ em: null as unknown as EntityManager }))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))

let tabs: FakeTabs
const onClose = vi.fn()
const onCreated = vi.fn()

function seedWorkbook(): FakeTabs {
  const seeded = new FakeTabs()
  seeded.seed('inventory', {
    id: 'INV1',
    type: 'filament',
    name: 'PLA White',
    qty_current: '800',
  })
  seeded.seed('inventory', {
    id: 'INV2',
    type: 'equipment',
    name: 'Ender 3',
    qty_current: '1',
  })
  return seeded
}

function renderDialog(open = true) {
  return renderRoute(
    <CreatePurchaseDialog open={open} onClose={onClose} onCreated={onCreated} />
  )
}

const addToInventory = () =>
  screen.getByRole('checkbox', { name: 'Add to inventory' })
const submit = () => screen.getByTestId('purchase-submit')
const amountField = () => screen.getByLabelText('Amount')

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  value: string
) {
  await user.clear(element)
  await user.type(element, value)
}

describe('CreatePurchaseDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The clock decides the default date.
    tabs = seedWorkbook()
    mocks.em = createTestEm(tabs, '2026-07-16T12:00:00.000Z')
  })

  it('renders nothing while closed', () => {
    renderDialog(false)

    expect(screen.queryByTestId('purchase-dialog')).not.toBeInTheDocument()
  })

  it('opens on today with inventory off', () => {
    renderDialog()

    expect(screen.getByTestId('purchase-dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toHaveValue('2026-07-16')
    expect(addToInventory()).not.toBeChecked()
    expect(screen.queryByTestId('purchase-line-0-qty')).not.toBeInTheDocument()
  })

  describe('overhead purchase', () => {
    it('records an expense and hands back the new id', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.selectOptions(screen.getByLabelText('Category'), 'electric')
      await fill(user, amountField(), '12')
      await fill(user, screen.getByLabelText('Notes'), 'January power')
      await user.click(submit())

      const created = createTestEm(tabs).transactions.find('T1')
      expect(created?.amount).toBe(-12)
      expect(created?.category).toBe('electric')
      expect(created?.concept).toBe('January power')
      expect(onClose).toHaveBeenCalled()
      expect(onCreated).toHaveBeenCalledWith('T1')
    })

    it('appends no inventory or lots', async () => {
      const user = userEvent.setup()
      renderDialog()

      await fill(user, amountField(), '12')
      await user.click(submit())

      const after = createTestEm(tabs)
      expect(after.lots.findAll()).toHaveLength(0)
      expect(after.inventory.findAll()).toHaveLength(2)
    })

    it('offers every expense category', () => {
      renderDialog()

      expect(
        Array.from(
          screen.getByLabelText('Category').querySelectorAll('option')
        ).map((option) => option.value)
      ).toEqual([
        'filament',
        'consumable',
        'equipment',
        'electric',
        'maintenance',
        'other',
      ])
    })

    it.each([
      ['a zero amount', '0'],
      ['a negative amount', '-5'],
    ])('rejects %s inline', async (_label, value) => {
      const user = userEvent.setup()
      renderDialog()

      await fill(user, amountField(), value)
      await user.click(submit())

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Amount must be greater than zero'
      )
      expect(onCreated).not.toHaveBeenCalled()
    })

    it('rejects a blank amount inline', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.click(submit())

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Amount must be greater than zero'
      )
      expect(onCreated).not.toHaveBeenCalled()
    })
  })

  describe('inventory purchase', () => {
    it('seeds a first line and restricts categories to materials', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.selectOptions(screen.getByLabelText('Category'), 'electric')
      await user.click(addToInventory())

      expect(
        Array.from(
          screen.getByLabelText('Category').querySelectorAll('option')
        ).map((option) => option.value)
      ).toEqual(['filament', 'consumable', 'equipment'])
      // 'electric' cannot buy stock, so the dialog moves to a category that can.
      expect(screen.getByLabelText('Category')).toHaveValue('filament')
      expect(screen.getByTestId('purchase-line-0-qty')).toBeInTheDocument()
    })

    it('keeps a category that is already a material one', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.selectOptions(screen.getByLabelText('Category'), 'consumable')
      await user.click(addToInventory())

      expect(screen.getByLabelText('Category')).toHaveValue('consumable')
    })

    it('drives the total from the lines and locks the amount field', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.click(addToInventory())
      await fill(user, screen.getByTestId('purchase-line-0-amount'), '19.99')

      const total = screen.getByLabelText('Total (line items)')
      expect(total).toHaveValue(19.99)
      expect(total).toHaveAttribute('readonly')

      await user.click(screen.getByTestId('purchase-add-line'))
      await fill(user, screen.getByTestId('purchase-line-1-amount'), '5.01')

      expect(screen.getByLabelText('Total (line items)')).toHaveValue(25)
    })

    it('buys stock of an existing item, topping up its quantity', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.click(addToInventory())
      await user.click(screen.getByLabelText('Inventory item'))
      await user.click(screen.getByRole('option', { name: 'PLA White' }))
      await fill(user, screen.getByTestId('purchase-line-0-qty'), '1000')
      await fill(user, screen.getByTestId('purchase-line-0-amount'), '19.99')
      await user.click(submit())

      const after = createTestEm(tabs)
      expect(after.inventory.find('INV1')?.qtyCurrent).toBe(1800)
      const lot = after.lots.findActiveByInventory('INV1')[0]
      expect([lot.quantity, lot.amount, lot.transactionId]).toEqual([
        1000,
        19.99,
        'T1',
      ])
      expect(after.transactions.find('T1')?.amount).toBe(-19.99)
      expect(onCreated).toHaveBeenCalledWith('T1')
    })

    it('creates a brand new item from a line', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.click(addToInventory())
      await user.click(screen.getByRole('button', { name: 'New item' }))
      await fill(
        user,
        screen.getByTestId('purchase-line-0-new-name'),
        'PETG Black'
      )
      await user.selectOptions(
        screen.getByLabelText('Inventory type'),
        'consumable'
      )
      await fill(user, screen.getByTestId('purchase-line-0-qty'), '500')
      await fill(user, screen.getByTestId('purchase-line-0-amount'), '19.99')
      await user.click(submit())

      const created = createTestEm(tabs).inventory.find('INV3')
      expect(created?.name).toBe('PETG Black')
      expect(created?.type).toBe('consumable')
      expect(created?.qtyCurrent).toBe(500)
      expect(onCreated).toHaveBeenCalledWith('T1')
    })

    it('records several lines in one purchase', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.click(addToInventory())
      await user.click(screen.getByLabelText('Inventory item'))
      await user.click(screen.getByRole('option', { name: 'PLA White' }))
      await fill(user, screen.getByTestId('purchase-line-0-qty'), '1000')
      await fill(user, screen.getByTestId('purchase-line-0-amount'), '20')

      await user.click(screen.getByTestId('purchase-add-line'))
      await user.click(screen.getAllByRole('button', { name: 'New item' })[1])
      await fill(
        user,
        screen.getByTestId('purchase-line-1-new-name'),
        'Nozzle 0.4'
      )
      await fill(user, screen.getByTestId('purchase-line-1-qty'), '2')
      await fill(user, screen.getByTestId('purchase-line-1-amount'), '5')

      await user.click(submit())

      const after = createTestEm(tabs)
      expect(after.transactions.find('T1')?.amount).toBe(-25)
      expect(after.lots.findActiveByTransaction('T1')).toHaveLength(2)
    })

    it('switches a line back from new to existing', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.click(addToInventory())
      await user.click(screen.getByRole('button', { name: 'New item' }))
      expect(screen.getByTestId('purchase-line-0-new-name')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Existing item' }))
      expect(
        screen.queryByTestId('purchase-line-0-new-name')
      ).not.toBeInTheDocument()
      expect(screen.getByLabelText('Inventory item')).toBeInTheDocument()
    })

    describe('quantity hint', () => {
      it('reads grams for a new filament line and units for other types', async () => {
        const user = userEvent.setup()
        renderDialog()

        await user.click(addToInventory())
        await user.click(screen.getByRole('button', { name: 'New item' }))
        expect(screen.getByLabelText('Quantity (g)')).toBeInTheDocument()

        await user.selectOptions(
          screen.getByLabelText('Inventory type'),
          'equipment'
        )
        expect(screen.getByLabelText('Quantity (units)')).toBeInTheDocument()
      })

      it('follows the selected existing item, defaulting to units', async () => {
        const user = userEvent.setup()
        renderDialog()

        await user.click(addToInventory())
        expect(screen.getByLabelText('Quantity (units)')).toBeInTheDocument()

        await user.click(screen.getByLabelText('Inventory item'))
        await user.click(screen.getByRole('option', { name: 'PLA White' }))
        expect(screen.getByLabelText('Quantity (g)')).toBeInTheDocument()

        // Clearing the query reopens the list on the already-focused input.
        await user.clear(screen.getByLabelText('Inventory item'))
        await user.click(screen.getByRole('option', { name: 'Ender 3' }))
        expect(screen.getByLabelText('Quantity (units)')).toBeInTheDocument()
      })
    })

    describe('inline validation', () => {
      it('asks for an item when no existing one is picked', async () => {
        const user = userEvent.setup()
        renderDialog()

        await user.click(addToInventory())
        await fill(user, screen.getByTestId('purchase-line-0-qty'), '1000')
        await fill(user, screen.getByTestId('purchase-line-0-amount'), '20')
        await user.click(submit())

        expect(screen.getByRole('alert')).toHaveTextContent(
          'No inventory item with this id.'
        )
        expect(onCreated).not.toHaveBeenCalled()
      })

      it('asks for a name on a new-item line', async () => {
        const user = userEvent.setup()
        renderDialog()

        await user.click(addToInventory())
        await user.click(screen.getByRole('button', { name: 'New item' }))
        await fill(user, screen.getByTestId('purchase-line-0-qty'), '500')
        await fill(user, screen.getByTestId('purchase-line-0-amount'), '20')
        await user.click(submit())

        expect(screen.getByRole('alert')).toHaveTextContent(
          'Inventory name is required'
        )
      })

      it('asks for a positive quantity', async () => {
        const user = userEvent.setup()
        renderDialog()

        await user.click(addToInventory())
        await user.click(screen.getByRole('button', { name: 'New item' }))
        await fill(user, screen.getByTestId('purchase-line-0-new-name'), 'PETG')
        await fill(user, screen.getByTestId('purchase-line-0-qty'), '0')
        await fill(user, screen.getByTestId('purchase-line-0-amount'), '20')
        await user.click(submit())

        expect(screen.getByRole('alert')).toHaveTextContent(
          'Quantity must be greater than zero'
        )
      })

      it('asks for a positive line cost', async () => {
        const user = userEvent.setup()
        renderDialog()

        await user.click(addToInventory())
        await user.click(screen.getByRole('button', { name: 'New item' }))
        await fill(user, screen.getByTestId('purchase-line-0-new-name'), 'PETG')
        await fill(user, screen.getByTestId('purchase-line-0-qty'), '500')
        await user.click(submit())

        expect(screen.getByRole('alert')).toHaveTextContent(
          'Amount must be greater than zero'
        )
      })
    })
  })

  it('closes without recording anything on cancel', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalled()
    expect(createTestEm(tabs).transactions.findAll()).toHaveLength(0)
  })
})
