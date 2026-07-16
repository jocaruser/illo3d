import { render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/Config/routes'
import { initI18n } from '@/I18n'
import { useShopStore } from '@/Store/shopStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

/*
 * Page controllers and the wizard are stubbed: this suite is about the route
 * table — which URL reaches which controller — not about the pages themselves.
 */
vi.mock('@/Controller/DashboardPage', () => ({ DashboardPage: () => <p>dashboard page</p> }))
vi.mock('@/Controller/ClientsPage', () => ({ ClientsPage: () => <p>clients page</p> }))
vi.mock('@/Controller/ClientDetailPage', () => ({
  ClientDetailPage: () => <p>client detail page</p>,
}))
vi.mock('@/Controller/JobsPage', () => ({ JobsPage: () => <p>jobs page</p> }))
vi.mock('@/Controller/JobDetailPage', () => ({ JobDetailPage: () => <p>job detail page</p> }))
vi.mock('@/Controller/TransactionsPage', () => ({
  TransactionsPage: () => <p>transactions page</p>,
}))
vi.mock('@/Controller/ExpenseTransactionDetailPage', () => ({
  ExpenseTransactionDetailPage: () => <p>expense transaction detail page</p>,
}))
vi.mock('@/Controller/InventoryPage', () => ({ InventoryPage: () => <p>inventory page</p> }))
vi.mock('@/Controller/InventoryDetailPage', () => ({
  InventoryDetailPage: () => <p>inventory detail page</p>,
}))
vi.mock('@/Controller/AuditLogPage', () => ({ AuditLogPage: () => <p>audit log page</p> }))

vi.mock('@/Component/wizard/SetupWizard', () => ({
  SetupWizard: () => <div data-testid="setup-wizard" />,
}))

vi.mock('@/Component/layout/AppHeader', () => ({ AppHeader: () => <header /> }))

vi.mock('@/Component/layout/FaviconUpdater', () => ({ FaviconUpdater: () => null }))

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}))

const i18n = initI18n('en')

function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const result = render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  )
  return { ...result, router }
}

function openShop() {
  useShopStore.getState().setActiveShop({
    folderId: 'folder-1',
    folderName: 'Shop',
    spreadsheetId: 'sheet-1',
    metadataVersion: '3.0.0',
  })
}

describe('routes', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    useShopStore.getState().clearActiveShop()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('redirects', () => {
    it('sends the root to the dashboard', async () => {
      const { router } = renderRoute('/')

      await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    })

    it('sends the retired login route through the root to the dashboard', async () => {
      const { router } = renderRoute('/login')

      await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'))
    })

    it('sends the retired expenses route to transactions', async () => {
      const { router } = renderRoute('/expenses')

      await waitFor(() => expect(router.state.location.pathname).toBe('/transactions'))
    })
  })

  describe('with a shop open', () => {
    beforeEach(() => {
      openShop()
    })

    it.each([
      ['/dashboard', 'dashboard page'],
      ['/clients', 'clients page'],
      ['/clients/CL1', 'client detail page'],
      ['/jobs', 'jobs page'],
      ['/jobs/J1', 'job detail page'],
      ['/transactions', 'transactions page'],
      ['/transactions/T1', 'expense transaction detail page'],
      ['/inventory', 'inventory page'],
      ['/inventory/INV1', 'inventory detail page'],
      ['/audit-log', 'audit log page'],
    ])('%s renders its controller', async (path, content) => {
      renderRoute(path)

      expect(await screen.findByText(content)).toBeInTheDocument()
    })

    it('shows a not-found card for an unknown route', async () => {
      renderRoute('/nope')

      expect(await screen.findByText('This page does not exist.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
        'href',
        '/dashboard'
      )
    })
  })

  describe('without a shop', () => {
    it('keeps the requested URL and shows the wizard instead of the page', async () => {
      const { router } = renderRoute('/transactions')

      expect(await screen.findByTestId('setup-wizard')).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/transactions')
      expect(screen.queryByText('transactions page')).not.toBeInTheDocument()
    })
  })
})
