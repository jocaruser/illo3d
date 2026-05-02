import { useEffect, useState } from 'react'
import {
  HashRouter,
  Routes,
  Route,
  Link,
  Navigate,
  NavLink,
  useLocation,
} from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import {
  matrixToClients,
  matrixToInventory,
  matrixToJobs,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { ProfileMenu } from './components/ProfileMenu'
import { GoogleSessionBanner } from './components/GoogleSessionBanner'
import { GoogleSessionError } from '@/services/google/authorizedFetch'
import { ConfirmDialog } from './components/ConfirmDialog'
import { GlobalHeaderSearch } from './components/GlobalHeaderSearch'
import { Breadcrumbs } from './components/Breadcrumbs'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SetupWizard } from './components/wizard/SetupWizard'
import { OperationToast } from './components/OperationToast'
import { BlockingOverlay } from './components/BlockingOverlay'
import { getBreadcrumbItems } from './breadcrumbItems'
import { TransactionsPage } from './pages/TransactionsPage'
import { ExpenseTransactionDetailPage } from './pages/ExpenseTransactionDetailPage'
import { InventoryPage } from './pages/InventoryPage'
import { InventoryDetailPage } from './pages/InventoryDetailPage'
import { ClientsPage } from './pages/ClientsPage'
import { JobsPage } from './pages/JobsPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { useAuthStore } from './stores/authStore'
import { useShopStore } from './stores/shopStore'
import { useBackendStore } from './stores/backendStore'
import { useWorkbookStore } from './stores/workbookStore'
import { useUserPreferencesStore } from './stores/userPreferencesStore'
import { getSheetsRepository } from '@/services/sheets/repository'
import { restoreLocalDirectoryHandle } from '@/services/local/persistDirectoryHandle'
import { toast } from './lib/toast'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'text-sm font-semibold text-gray-900 dark:text-gray-100'
    : 'text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const resolveJobDescription = (jobId: string): string | undefined => {
    const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
    return jobs.find((j) => j.id === jobId)?.description
  }

  const resolveClientName = (clientId: string): string | undefined => {
    const clients = matrixToClients(useWorkbookStore.getState().tabs.clients)
    return clients.find((c) => c.id === clientId)?.name
  }

  const resolveInventoryName = (inventoryId: string): string | undefined => {
    const rows = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    return rows.find((i) => i.id === inventoryId)?.name
  }

  const resolveTransactionConcept = (id: string): string | undefined => {
    const txs = matrixToTransactions(useWorkbookStore.getState().tabs.transactions)
    return txs.find((x) => x.id === id)?.concept
  }

  const breadcrumbItems = getBreadcrumbItems(
    location.pathname,
    t,
    resolveJobDescription,
    resolveClientName,
    resolveInventoryName,
    resolveTransactionConcept,
  )
  const activeShop = useShopStore((s) => s.activeShop)
  const logout = useAuthStore((s) => s.logout)
  const clearActiveShop = useShopStore((s) => s.clearActiveShop)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)
  const refreshWorkbook = useWorkbookStore((s) => s.refresh)
  const saveWorkbook = useWorkbookStore((s) => s.save)
  const resetWorkbook = useWorkbookStore((s) => s.reset)
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookDirty = useWorkbookStore((s) => s.dirty)
  const backend = useBackendStore((s) => s.backend)
  const localDirectoryHandle = useBackendStore((s) => s.localDirectoryHandle)

  const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)

  useEffect(() => {
    const spreadsheetId = activeShop?.spreadsheetId
    if (!spreadsheetId) {
      resetWorkbook()
      return
    }
    if (backend === 'local-csv' && !localDirectoryHandle) {
      return
    }
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }, [activeShop?.spreadsheetId, backend, localDirectoryHandle, hydrateWorkbook, resetWorkbook])

  useEffect(() => {
    if (!workbookDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [workbookDirty])

  const runRefresh = () => {
    void refreshWorkbook(getSheetsRepository())
  }

  const onRefreshClick = () => {
    if (workbookStatus === 'loading' || saveBusy) return
    if (workbookDirty) {
      setRefreshConfirmOpen(true)
      return
    }
    runRefresh()
  }

  const confirmRefreshDiscard = () => {
    setRefreshConfirmOpen(false)
    runRefresh()
  }

  const onSaveClick = async () => {
    if (workbookStatus !== 'ready' || saveBusy || !workbookDirty) return
    setSaveBusy(true)
    try {
      await saveWorkbook(getSheetsRepository())
      toast.success(t('workbook.saveSuccess'))
    } catch (e) {
      const message =
        e instanceof GoogleSessionError
          ? t('errors.googleSession')
          : `${t('workbook.saveError')}: ${e instanceof Error ? e.message : String(e)}`
      toast.error(message, {
        label: t('workbook.retry'),
        onClick: () => void onSaveClick(),
      })
    } finally {
      setSaveBusy(false)
    }
  }

  const workbookActionsVisible = Boolean(activeShop)
  const refreshDisabled =
    workbookStatus === 'loading' ||
    saveBusy ||
    workbookStatus === 'idle' ||
    !activeShop?.spreadsheetId
  const saveDisabled =
    workbookStatus !== 'ready' ||
    saveBusy ||
    !workbookDirty ||
    !activeShop?.spreadsheetId

  const resetBackend = useBackendStore((s) => s.reset)

  useEffect(() => {
    if (backend !== 'local-csv') return
    if (localDirectoryHandle) return
    void restoreLocalDirectoryHandle().then((handle) => {
      if (handle) {
        useBackendStore.getState().setLocalDirectoryHandle(handle)
      }
    })
  }, [backend, localDirectoryHandle])

  const handleWizardCancel = () => {
    clearActiveShop()
    resetBackend()
    logout()
  }

  const navLinks = (
    <>
      <NavLink to="/dashboard" className={navLinkClassName} end onClick={() => setMenuOpen(false)}>
        {t('nav.dashboard')}
      </NavLink>
      <NavLink to="/clients" className={navLinkClassName} onClick={() => setMenuOpen(false)}>
        {t('nav.clients')}
      </NavLink>
      <NavLink to="/jobs" className={navLinkClassName} onClick={() => setMenuOpen(false)}>
        {t('nav.jobs')}
      </NavLink>
      <NavLink
        to="/transactions"
        className={({ isActive }) =>
          navLinkClassName({
            isActive:
              isActive || location.pathname.startsWith('/transactions/'),
          })
        }
        end
        onClick={() => setMenuOpen(false)}
      >
        {t('nav.transactions')}
      </NavLink>
      <NavLink to="/inventory" className={navLinkClassName} onClick={() => setMenuOpen(false)}>
        {t('nav.inventory')}
      </NavLink>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <GoogleSessionBanner />
      <header className="bg-white shadow-sm dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-6">
              <Link to="/" className="text-xl font-bold text-gray-800 dark:text-gray-200">
                illo3d
              </Link>
              <nav className="hidden gap-6 md:flex">{navLinks}</nav>
            </div>
            <div className="flex shrink-0 items-center gap-2 md:gap-4">
              {workbookActionsVisible ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    data-testid="workbook-refresh"
                    disabled={refreshDisabled}
                    onClick={onRefreshClick}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {t('workbook.refresh')}
                  </button>
                  <button
                    type="button"
                    data-testid="workbook-save"
                    disabled={saveDisabled}
                    onClick={() => void onSaveClick()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saveBusy ? t('workbook.saving') : t('workbook.save')}
                  </button>
                </div>
              ) : null}
              <ProfileMenu />
              <button
                type="button"
                aria-label={t('nav.toggleMenu')}
                className="md:hidden"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <svg
                  className="h-6 w-6 text-gray-700 dark:text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {activeShop ? (
            <div className="mt-3 w-full md:max-w-xl space-y-2">
              {workbookActionsVisible ? (
                <div className="flex flex-wrap items-center gap-2 sm:hidden">
                  <button
                    type="button"
                    data-testid="workbook-refresh-mobile"
                    disabled={refreshDisabled}
                    onClick={onRefreshClick}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {t('workbook.refresh')}
                  </button>
                  <button
                    type="button"
                    data-testid="workbook-save-mobile"
                    disabled={saveDisabled}
                    onClick={() => void onSaveClick()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saveBusy ? t('workbook.saving') : t('workbook.save')}
                  </button>
                </div>
              ) : null}
              <GlobalHeaderSearch />
            </div>
          ) : null}
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-2 border-t border-gray-200 px-4 py-3 md:hidden dark:border-gray-700">
            {navLinks}
          </nav>
        )}
      </header>
      {breadcrumbItems ? (
        <Breadcrumbs
          items={breadcrumbItems}
          ariaLabel={t('breadcrumb.ariaLabel')}
        />
      ) : null}
      <main>{children}</main>
      {!activeShop && (
        <SetupWizard onCancel={handleWizardCancel} />
      )}

      <ConfirmDialog
        isOpen={refreshConfirmOpen}
        title={t('workbook.discardTitle')}
        message={t('workbook.discardMessage')}
        confirmLabel={t('workbook.discardConfirm')}
        cancelLabel={t('workbook.cancel')}
        onConfirm={confirmRefreshDiscard}
        onCancel={() => setRefreshConfirmOpen(false)}
      />
    </div>
  )
}

function RootRedirect() {
  return <Navigate to="/dashboard" replace />
}

function AppShell() {
  const theme = useUserPreferencesStore((s) => s.theme)
  return (
    <>
      <Toaster
        position="bottom-right"
        theme={theme}
        toastOptions={{
          className: 'dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700',
        }}
      />
      <OperationToast />
      <BlockingOverlay />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/"
            element={
              <Layout>
                <RootRedirect />
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/clients"
            element={
              <Layout>
                <ProtectedRoute>
                  <ClientsPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/clients/:clientId"
            element={
              <Layout>
                <ProtectedRoute>
                  <ClientDetailPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/jobs"
            element={
              <Layout>
                <ProtectedRoute>
                  <JobsPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/jobs/:jobId"
            element={
              <Layout>
                <ProtectedRoute>
                  <JobDetailPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/transactions"
            element={
              <Layout>
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/transactions/:transactionId"
            element={
              <Layout>
                <ProtectedRoute>
                  <ExpenseTransactionDetailPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route path="/expenses" element={<Navigate to="/transactions" replace />} />
          <Route
            path="/inventory"
            element={
              <Layout>
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/inventory/:inventoryId"
            element={
              <Layout>
                <ProtectedRoute>
                  <InventoryDetailPage />
                </ProtectedRoute>
              </Layout>
            }
          />
        </Routes>
      </HashRouter>
    </>
  )
}

export default function App() {
  return <AppShell />
}
