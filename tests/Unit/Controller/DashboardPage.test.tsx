import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardPage } from '@/Controller/DashboardPage'
import { useWorkbookStore, type WorkbookStatus } from '@/Store/workbookStore'
import { renderWithProviders } from '../Component/helpers/renderWithProviders'
import { seedClient, seedInventory, seedJob, seedTransaction, setupShop } from '../Component/dashboard/harness'
import type { TestContext } from '../Service/helpers'

vi.mock('@/Hook/useEntityManager', async () => {
  const harness = await import('../Component/dashboard/harness')
  return { useEntityManager: () => harness.currentEm() }
})

vi.mock('@/Hook/useShopMetadata', async () => {
  const harness = await import('../Component/dashboard/harness')
  return { useShopMetadata: () => harness.currentMetadata() }
})

/** The create dialogs are a sibling's unit; here only the wiring matters. */
interface StubDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: (id: string) => void
}

vi.mock('@/Component/detail/CreateJobDialog', () => ({
  CreateJobDialog: ({ open, onClose, onCreated }: StubDialogProps) =>
    open ? (
      <div data-testid="create-job-dialog">
        <button type="button" onClick={onClose}>
          close-job
        </button>
        <button type="button" onClick={() => onCreated?.('J9')}>
          created-job
        </button>
      </div>
    ) : null,
}))

vi.mock('@/Component/detail/CreatePurchaseDialog', () => ({
  CreatePurchaseDialog: ({ open, onClose, onCreated }: StubDialogProps) =>
    open ? (
      <div data-testid="create-purchase-dialog">
        <button type="button" onClick={onClose}>
          close-purchase
        </button>
        <button type="button" onClick={() => onCreated?.('T9')}>
          created-purchase
        </button>
      </div>
    ) : null,
}))

let context: TestContext

function setWorkbook(status: WorkbookStatus, error: string | null = null): void {
  useWorkbookStore.setState({ status, error })
}

function renderPage(): HTMLElement {
  const { container } = renderWithProviders(<DashboardPage />)
  return container.firstElementChild as HTMLElement
}

describe('DashboardPage', () => {
  beforeEach(() => {
    context = setupShop()
    useWorkbookStore.getState().reset()
    setWorkbook('ready')
  })

  describe('workbook gating', () => {
    it.each(['idle', 'loading'] as const)('waits while the workbook is %s', (status) => {
      setWorkbook(status)

      const root = renderPage()

      expect(root).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.queryByText('Balance')).not.toBeInTheDocument()
    })

    it('surfaces a load failure instead of the dashboard', () => {
      setWorkbook('error', 'Sheets exploded')

      renderPage()

      expect(screen.getByRole('alert')).toHaveTextContent('Sheets exploded')
      expect(screen.queryByText('Balance')).not.toBeInTheDocument()
    })

    it('falls back to a generic message when the error carries no detail', () => {
      setWorkbook('error')

      renderPage()

      expect(screen.getByRole('alert')).toHaveTextContent('Could not load workbook.')
    })

    it('drops aria-busy once the workbook is ready', () => {
      expect(renderPage()).toHaveAttribute('aria-busy', 'false')
    })
  })

  describe('when ready', () => {
    beforeEach(() => {
      seedClient(context.tabs, { id: 'CL1', name: 'Acme' })
      seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Vase', due_date: '2026-07-20' })
      seedTransaction(context.tabs, {
        id: 'T1',
        date: '2026-07-02',
        type: 'income',
        concept: 'Paid job',
        amount: '100',
      })
      seedInventory(context.tabs, { id: 'INV1', name: 'PLA', qty_current: '10', warn_red: '100' })
    })

    it('lays out the stats, benefit, board and the two widgets', () => {
      renderPage()

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
      expect(screen.getByText('Balance')).toBeInTheDocument()
      expect(screen.getByText('Expected benefit (active jobs)')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Draft' })).toBeInTheDocument()
      expect(screen.getByText('Stock alerts')).toBeInTheDocument()
      expect(screen.getByText('Recent transactions')).toBeInTheDocument()
    })

    it('starts on the kanban and swaps to the calendar and back', async () => {
      renderPage()

      expect(screen.getByRole('tab', { name: 'Kanban' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('region', { name: 'Draft' })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('tab', { name: 'Calendar' }))

      expect(screen.getByRole('heading', { name: 'July 2026' })).toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Draft' })).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('tab', { name: 'Kanban' }))

      expect(screen.getByRole('region', { name: 'Draft' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'July 2026' })).not.toBeInTheDocument()
    })

    describe('add job', () => {
      it('opens the dialog', async () => {
        renderPage()
        expect(screen.queryByTestId('create-job-dialog')).not.toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: 'Add job' }))

        expect(screen.getByTestId('create-job-dialog')).toBeInTheDocument()
      })

      it('closes on cancel', async () => {
        renderPage()
        await userEvent.click(screen.getByRole('button', { name: 'Add job' }))

        await userEvent.click(screen.getByRole('button', { name: 'close-job' }))

        expect(screen.queryByTestId('create-job-dialog')).not.toBeInTheDocument()
      })

      it('closes once a job is created', async () => {
        renderPage()
        await userEvent.click(screen.getByRole('button', { name: 'Add job' }))

        await userEvent.click(screen.getByRole('button', { name: 'created-job' }))

        expect(screen.queryByTestId('create-job-dialog')).not.toBeInTheDocument()
      })
    })

    describe('record purchase', () => {
      it('opens the dialog', async () => {
        renderPage()
        expect(screen.queryByTestId('create-purchase-dialog')).not.toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: 'Record purchase' }))

        expect(screen.getByTestId('create-purchase-dialog')).toBeInTheDocument()
      })

      it('closes on cancel', async () => {
        renderPage()
        await userEvent.click(screen.getByRole('button', { name: 'Record purchase' }))

        await userEvent.click(screen.getByRole('button', { name: 'close-purchase' }))

        expect(screen.queryByTestId('create-purchase-dialog')).not.toBeInTheDocument()
      })

      it('closes once a purchase is recorded', async () => {
        renderPage()
        await userEvent.click(screen.getByRole('button', { name: 'Record purchase' }))

        await userEvent.click(screen.getByRole('button', { name: 'created-purchase' }))

        expect(screen.queryByTestId('create-purchase-dialog')).not.toBeInTheDocument()
      })
    })
  })
})
