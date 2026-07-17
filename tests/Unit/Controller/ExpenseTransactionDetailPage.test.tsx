import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseTransactionDetailPage } from '@/Controller/ExpenseTransactionDetailPage'
import type { EntityManager } from '@/Repository/EntityManager'
import { createTestEm, FakeTabs, renderRoute } from '../helpers/workbookTestBed'

const mocks = vi.hoisted(() => ({
  em: null as unknown as EntityManager,
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))
vi.mock('@/Component/Toast', () => ({ toast: mocks.toast }))

let tabs: FakeTabs

/** T11: a €29.99 filament purchase backed by one lot. */
function seedWorkbook(): FakeTabs {
  const seeded = new FakeTabs()
  seeded.seed('clients', { id: 'CL1', name: 'TechStart Solutions' })
  seeded.seed('inventory', { id: 'INV1', type: 'filament', name: 'PLA White' })
  seeded.seed('transactions', {
    id: 'T11',
    date: '2026-01-15',
    type: 'expense',
    amount: '-29.99',
    category: 'filament',
    concept: 'PLA White restock',
  })
  seeded.seed('lots', {
    id: 'L1',
    inventory_id: 'INV1',
    transaction_id: 'T11',
    quantity: '1000',
    amount: '29.99',
    created_at: '2026-01-15T10:00:00.000Z',
  })
  return seeded
}

function renderDetail(id = 'T11') {
  return renderRoute(<ExpenseTransactionDetailPage />, {
    path: '/transactions/:transactionId',
    entry: `/transactions/${id}`,
  })
}

const amountInput = () => screen.getByTestId('expense-detail-amount-input')
const saveButton = () => screen.getByTestId('expense-detail-save-changes')

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  value: string
) {
  await user.clear(element)
  if (value !== '') await user.type(element, value)
}

describe('ExpenseTransactionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tabs = seedWorkbook()
    mocks.em = createTestEm(tabs)
  })

  describe('routing', () => {
    it('renders the expense with its fields', () => {
      renderDetail()

      expect(
        screen.getByRole('heading', { name: 'PLA White restock' })
      ).toBeInTheDocument()
      expect(screen.getByText('T11')).toBeInTheDocument()
      expect(screen.getByText('2026-01-15')).toBeInTheDocument()
      expect(screen.getByText('Expense')).toBeInTheDocument()
      expect(screen.getByText('filament')).toBeInTheDocument()
    })

    it('refuses an income id, which has no expense to edit', () => {
      tabs.seed('transactions', {
        id: 'T1',
        type: 'income',
        amount: '120',
        concept: 'Paid',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T1')

      expect(
        screen.getByText(
          'This transaction could not be found or is not an expense.'
        )
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'Back to transactions' })
      ).toHaveAttribute('href', '/transactions')
    })

    it('refuses an unknown id', () => {
      renderDetail('NOPE')

      expect(
        screen.getByText(
          'This transaction could not be found or is not an expense.'
        )
      ).toBeInTheDocument()
    })
  })

  describe('concept and client fields', () => {
    it('links the concept to the expense itself when it bought stock', () => {
      renderDetail()

      expect(
        screen.getByRole('link', { name: 'PLA White restock' })
      ).toHaveAttribute('href', '/transactions/T11')
    })

    it('links the concept to the job when the expense came from one', () => {
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T20',
        date: '2026-03-01',
        type: 'expense',
        amount: '-5',
        concept: 'Job refund',
        ref_type: 'job',
        ref_id: 'J1',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T20')

      expect(screen.getByRole('link', { name: 'Job refund' })).toHaveAttribute(
        'href',
        '/jobs/J1'
      )
    })

    it('leaves an overhead concept unlinked', () => {
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T12',
        date: '2026-01-20',
        type: 'expense',
        amount: '-10',
        concept: 'January power',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T12')

      expect(
        screen.queryByRole('link', { name: 'January power' })
      ).not.toBeInTheDocument()
    })

    it('links a client when there is one, and shows nothing otherwise', () => {
      renderDetail()
      expect(
        screen.queryByRole('link', { name: 'TechStart Solutions' })
      ).not.toBeInTheDocument()

      tabs = seedWorkbook()
      tabs.seed('transactions', {
        id: 'T21',
        date: '2026-03-01',
        type: 'expense',
        amount: '-5',
        concept: 'Client refund',
        client_id: 'CL1',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T21')

      expect(
        screen.getByRole('link', { name: 'TechStart Solutions' })
      ).toHaveAttribute('href', '/clients/CL1')
    })
  })

  describe('linked lots', () => {
    it('links the material and omits a purchase-date column', () => {
      renderDetail()

      expect(
        screen.getByRole('heading', { name: 'Linked lots' })
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('expense-detail-lot-material-L1')
      ).toHaveAttribute('href', '/inventory/INV1')

      const headers = within(screen.getByRole('table')).getAllByRole(
        'columnheader'
      )
      expect(headers.map((header) => header.textContent)).toEqual([
        'Material',
        'Quantity',
        'Amount',
      ])
    })

    it('falls back to the inventory id when the material is gone', () => {
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T11',
        type: 'expense',
        amount: '-1',
        concept: 'X',
      })
      tabs.seed('lots', {
        id: 'L1',
        inventory_id: 'INV404',
        transaction_id: 'T11',
        quantity: '1',
        amount: '1',
      })
      mocks.em = createTestEm(tabs)
      renderDetail()

      expect(
        screen.getByTestId('expense-detail-lot-material-L1')
      ).toHaveTextContent('INV404')
    })

    it('starts every field blank when the workbook has no figures to show', () => {
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T30',
        type: 'expense',
        amount: '',
        concept: 'Unpriced',
      })
      tabs.seed('lots', {
        id: 'L9',
        inventory_id: 'INV1',
        transaction_id: 'T30',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T30')

      expect(amountInput()).toHaveValue(null)
      expect(
        screen.getByTestId('expense-detail-lot-quantity-input-L9')
      ).toHaveValue(null)
      expect(
        screen.getByTestId('expense-detail-lot-amount-input-L9')
      ).toHaveValue(null)
    })

    it('shows an empty row when the expense bought no stock', () => {
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T12',
        type: 'expense',
        amount: '-10',
        concept: 'Power',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T12')

      expect(
        screen.getByText('No linked purchase lots for this expense.')
      ).toBeInTheDocument()
    })
  })

  describe('live validation', () => {
    it('complains about an amount that is not negative', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(user, amountInput(), '29.99')
      expect(
        screen.getByText(/Enter a valid expense amount/)
      ).toBeInTheDocument()

      await fill(user, amountInput(), '-29.99')
      expect(
        screen.queryByText(/Enter a valid expense amount/)
      ).not.toBeInTheDocument()
    })

    it('complains about a blank amount', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(user, amountInput(), '')
      expect(
        screen.getByText(/Enter a valid expense amount/)
      ).toBeInTheDocument()
    })

    it('complains about a non-positive lot quantity', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(
        user,
        screen.getByTestId('expense-detail-lot-quantity-input-L1'),
        '0'
      )
      expect(
        screen.getByText(/Enter a positive quantity for this lot/)
      ).toBeInTheDocument()
    })

    it('complains about a negative lot amount', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(
        user,
        screen.getByTestId('expense-detail-lot-amount-input-L1'),
        '-1'
      )
      expect(
        screen.getByText(/Enter a non-negative amount for this lot/)
      ).toBeInTheDocument()
    })
  })

  describe('lot-sum mismatch', () => {
    it('warns and blocks the save when the total drifts from the lots', async () => {
      const user = userEvent.setup()
      renderDetail()

      expect(
        screen.queryByTestId('expense-detail-lot-sum-mismatch')
      ).not.toBeInTheDocument()
      expect(saveButton()).toBeEnabled()

      await fill(user, amountInput(), '-1')

      expect(
        screen.getByTestId('expense-detail-lot-sum-mismatch')
      ).toHaveTextContent(
        'Lot line amounts sum to €29.99 but this expense total is €1.00'
      )
      expect(saveButton()).toBeDisabled()

      await fill(user, amountInput(), '-29.99')
      expect(
        screen.queryByTestId('expense-detail-lot-sum-mismatch')
      ).not.toBeInTheDocument()
      expect(saveButton()).toBeEnabled()
    })

    it('blocks the save when a lot amount drifts from the total', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(
        user,
        screen.getByTestId('expense-detail-lot-amount-input-L1'),
        '1'
      )
      expect(
        screen.getByTestId('expense-detail-lot-sum-mismatch')
      ).toBeInTheDocument()
      expect(saveButton()).toBeDisabled()

      await fill(
        user,
        screen.getByTestId('expense-detail-lot-amount-input-L1'),
        '29.99'
      )
      expect(
        screen.queryByTestId('expense-detail-lot-sum-mismatch')
      ).not.toBeInTheDocument()
      expect(saveButton()).toBeEnabled()
    })

    it('tolerates a sub-cent difference', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(user, amountInput(), '-30')

      expect(
        screen.queryByTestId('expense-detail-lot-sum-mismatch')
      ).not.toBeInTheDocument()
      expect(saveButton()).toBeEnabled()
    })

    it('compares magnitudes, so a positive lot amount still matches', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(
        user,
        screen.getByTestId('expense-detail-lot-amount-input-L1'),
        '29.99'
      )
      expect(
        screen.queryByTestId('expense-detail-lot-sum-mismatch')
      ).not.toBeInTheDocument()
    })

    it('cannot judge a mismatch while a figure is unreadable, so it lets Save through', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(
        user,
        screen.getByTestId('expense-detail-lot-amount-input-L1'),
        ''
      )
      expect(
        screen.queryByTestId('expense-detail-lot-sum-mismatch')
      ).not.toBeInTheDocument()
      expect(saveButton()).toBeEnabled()

      await fill(user, amountInput(), '')
      expect(
        screen.queryByTestId('expense-detail-lot-sum-mismatch')
      ).not.toBeInTheDocument()
    })

    it('never warns when the expense has no lots to disagree with', async () => {
      const user = userEvent.setup()
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T12',
        type: 'expense',
        amount: '-10',
        concept: 'Power',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T12')

      await fill(user, amountInput(), '-999')

      expect(
        screen.queryByTestId('expense-detail-lot-sum-mismatch')
      ).not.toBeInTheDocument()
      expect(saveButton()).toBeEnabled()
    })
  })

  describe('saving', () => {
    it('persists the total and every lot change in one go', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(user, amountInput(), '-40')
      await fill(
        user,
        screen.getByTestId('expense-detail-lot-quantity-input-L1'),
        '1500'
      )
      await fill(
        user,
        screen.getByTestId('expense-detail-lot-amount-input-L1'),
        '40'
      )
      await user.click(saveButton())

      const after = createTestEm(tabs)
      expect(after.transactions.find('T11')?.amount).toBe(-40)
      expect(after.lots.find('L1')?.quantity).toBe(1500)
      expect(after.lots.find('L1')?.amount).toBe(40)
      expect(mocks.toast.success).toHaveBeenCalledWith('Saved successfully')
    })

    it('persists the amount alone when there are no lots', async () => {
      const user = userEvent.setup()
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T12',
        type: 'expense',
        amount: '-10',
        concept: 'Power',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T12')

      await fill(user, amountInput(), '-12.5')
      await user.click(saveButton())

      expect(createTestEm(tabs).transactions.find('T12')?.amount).toBe(-12.5)
      expect(mocks.toast.success).toHaveBeenCalled()
    })

    it('reports a rejected amount and leaves the workbook untouched', async () => {
      const user = userEvent.setup()
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T12',
        type: 'expense',
        amount: '-10',
        concept: 'Power',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T12')

      await fill(user, amountInput(), '5')
      await user.click(saveButton())

      expect(screen.getAllByRole('alert').at(-1)).toHaveTextContent(
        /Enter a valid expense amount/
      )
      expect(createTestEm(tabs).transactions.find('T12')?.amount).toBe(-10)
      expect(mocks.toast.success).not.toHaveBeenCalled()
    })

    it('reports a rejected lot and stops before the rest', async () => {
      const user = userEvent.setup()
      renderDetail()

      // An unreadable lot amount hides the mismatch check, so Save stays live
      // and the service gets the last word.
      await fill(
        user,
        screen.getByTestId('expense-detail-lot-quantity-input-L1'),
        '0'
      )
      await fill(
        user,
        screen.getByTestId('expense-detail-lot-amount-input-L1'),
        ''
      )
      await user.click(saveButton())

      expect(screen.getAllByRole('alert').at(-1)).toHaveTextContent(
        /Enter a positive quantity for this lot/
      )
      expect(createTestEm(tabs).lots.find('L1')?.quantity).toBe(1000)
      expect(mocks.toast.success).not.toHaveBeenCalled()
    })

    it('reports a blank amount as unsaveable', async () => {
      const user = userEvent.setup()
      tabs = new FakeTabs()
      tabs.seed('transactions', {
        id: 'T12',
        type: 'expense',
        amount: '-10',
        concept: 'Power',
      })
      mocks.em = createTestEm(tabs)
      renderDetail('T12')

      await fill(user, amountInput(), '')
      await user.click(saveButton())

      expect(screen.getAllByRole('alert').at(-1)).toHaveTextContent(
        /Enter a valid expense amount/
      )
      expect(createTestEm(tabs).transactions.find('T12')?.amount).toBe(-10)
    })

    it('reports a blank lot quantity as unsaveable', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(
        user,
        screen.getByTestId('expense-detail-lot-quantity-input-L1'),
        ''
      )
      await user.click(saveButton())

      expect(screen.getAllByRole('alert').at(-1)).toHaveTextContent(
        /Enter a positive quantity for this lot/
      )
      expect(createTestEm(tabs).lots.find('L1')?.quantity).toBe(1000)
    })

    it('reports a rejected lot amount', async () => {
      const user = userEvent.setup()
      renderDetail()

      await fill(user, amountInput(), '-29.99')
      await fill(
        user,
        screen.getByTestId('expense-detail-lot-amount-input-L1'),
        'x'
      )
      await user.click(saveButton())

      expect(screen.getAllByRole('alert').at(-1)).toHaveTextContent(
        /Enter a non-negative amount for this lot/
      )
      expect(createTestEm(tabs).lots.find('L1')?.amount).toBe(29.99)
    })
  })
})
