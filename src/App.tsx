import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  NavLink,
  useLocation,
} from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { matrixToClients, matrixToJobs } from '@/lib/workbook/workbookEntities'
import { AuthStatus } from './components/AuthStatus'
import { ConfirmDialog } from './components/ConfirmDialog'
import { GlobalHeaderSearch } from './components/GlobalHeaderSearch'
import { Breadcrumbs } from './components/Breadcrumbs'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SetupWizard } from './components/wizard/SetupWizard'
import { getBreadcrumbItems } from './breadcrumbItems'
import { LoginPage } from './pages/LoginPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { InventoryPage } from './pages/InventoryPage'
import { ClientsPage } from './pages/ClientsPage'
import { JobsPage } from './pages/JobsPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { useAuthStore } from './stores/authStore'
import { useShopStore } from './stores/shopStore'
import { useWorkbookStore } from './stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'text-sm font-semibold text-gray-900'
    : 'text-sm text-gray-600 hover:text-gray-800'
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

  const breadcrumbItems = getBreadcrumbItems(
    location.pathname,
    t,
    resolveJobDescription,
    resolveClientName,
  )
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const activeShop = useShopStore((s) => s.activeShop)
  const logout = useAuthStore((s) => s.logout)
  const clearActiveShop = useShopStore((s) => s.clearActiveShop)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)
  const refreshWorkbook = useWorkbookStore((s) => s.refresh)
  const saveWorkbook = useWorkbookStore((s) => s.save)
  const resetWorkbook = useWorkbookStore((s) => s.reset)
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookError = useWorkbookStore((s) => s.error)
  const workbookDirty = useWorkbookStore((s) => s.dirty)

  const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<
    null | { kind: 'success' } | { kind: 'error'; message: string }
  >(null)

  useEffect(() => {
    const spreadsheetId = activeShop?.spreadsheetId
    if (!spreadsheetId) {
      resetWorkbook()
      return
    }
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }, [activeShop?.spreadsheetId, hydrateWorkbook, resetWorkbook])

  useEffect(() => {
    if (!workbookDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [workbookDirty])

  useEffect(() => {
    if (saveFeedback?.kind !== 'success') return
    const id = window.setTimeout(() => setSaveFeedback(null), 2800)
    return () => window.clearTimeout(id)
  }, [saveFeedback])

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
    setSaveFeedback(null)
    setSaveBusy(true)
    try {
      await saveWorkbook(getSheetsRepository())
      setSaveFeedback({ kind: 'success' })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setSaveFeedback({ kind: 'error', message })
    } finally {
      setSaveBusy(false)
    }
  }

  const workbookActionsVisible = Boolean(isAuthenticated && activeShop)
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

  const handleWizardCancel = () => {
    clearActiveShop()
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
      <NavLink to="/transactions" className={navLinkClassName} end onClick={() => setMenuOpen(false)}>
        {t('nav.transactions')}
      </NavLink>
      <NavLink to="/expenses" className={navLinkClassName} end onClick={() => setMenuOpen(false)}>
        {t('nav.expenses')}
      </NavLink>
      <NavLink to="/inventory" className={navLinkClassName} end onClick={() => setMenuOpen(false)}>
        {t('nav.inventory')}
      </NavLink>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-6">
              <Link to="/" className="text-xl font-bold text-gray-800">
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
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
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
              <AuthStatus />
              <button
                type="button"
                aria-label={t('nav.toggleMenu')}
                className="md:hidden"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <svg
                  className="h-6 w-6 text-gray-700"
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
          {isAuthenticated && activeShop ? (
            <div className="mt-3 w-full md:max-w-xl space-y-2">
              {workbookActionsVisible ? (
                <div className="flex flex-wrap items-center gap-2 sm:hidden">
                  <button
                    type="button"
                    data-testid="workbook-refresh-mobile"
                    disabled={refreshDisabled}
                    onClick={onRefreshClick}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
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
              {saveFeedback?.kind === 'success' ? (
                <p className="text-sm text-green-800" role="status">
                  {t('workbook.saveSuccess')}
                </p>
              ) : null}
              {saveFeedback?.kind === 'error' ? (
                <p className="text-sm text-red-700" role="alert">
                  {t('workbook.saveError')}
                  {saveFeedback.message ? `: ${saveFeedback.message}` : ''}
                </p>
              ) : null}
              {workbookStatus === 'loading' ? (
                <p className="text-sm text-gray-600" role="status">
                  {t('workbook.loading')}
                </p>
              ) : null}
              {workbookStatus === 'error' && workbookError ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-red-700">
                  <span>{t('workbook.loadFailed')}</span>
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-0.5 font-medium hover:bg-red-50"
                    onClick={() => {
                      if (activeShop?.spreadsheetId) {
                        void hydrateWorkbook(
                          getSheetsRepository(),
                          activeShop.spreadsheetId
                        )
                      }
                    }}
                  >
                    {t('workbook.retry')}
                  </button>
                </div>
              ) : null}
              <GlobalHeaderSearch />
            </div>
          ) : null}
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-2 border-t border-gray-200 px-4 py-3 md:hidden">
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
      {isAuthenticated && !activeShop && (
        <SetupWizard
          onCancel={handleWizardCancel}
          onCreateComplete={() => {}}
          onOpenComplete={() => {}}
        />
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const activeShop = useShopStore((s) => s.activeShop)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!activeShop) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          path="/expenses"
          element={
            <Layout>
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            </Layout>
          }
        />
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
      </Routes>
    </BrowserRouter>
  )
}
