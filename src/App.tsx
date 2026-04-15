import { useState } from 'react'
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
import { useQueryClient } from '@tanstack/react-query'
import { AuthStatus } from './components/AuthStatus'
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
import { useAuthStore } from './stores/authStore'
import { useShopStore } from './stores/shopStore'
import type { Client, Job } from './types/money'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'text-sm font-semibold text-gray-900'
    : 'text-sm text-gray-600 hover:text-gray-800'
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const resolveJobDescription = (jobId: string): string | undefined => {
    const queries = queryClient.getQueriesData<Job[]>({ queryKey: ['jobs'] })
    for (const [, data] of queries) {
      const job = data?.find((j) => j.id === jobId)
      if (job) return job.description
    }
    return undefined
  }

  const resolveClientName = (clientId: string): string | undefined => {
    const queries = queryClient.getQueriesData<Client[]>({
      queryKey: ['clients'],
    })
    for (const [, data] of queries) {
      const client = data?.find((c) => c.id === clientId)
      if (client) return client.name
    }
    return undefined
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

  const handleWizardCancel = () => {
    clearActiveShop()
    logout()
  }

  const navLinks = (
    <>
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-gray-800">
              illo3d
            </Link>
            <nav className="hidden gap-6 md:flex">{navLinks}</nav>
          </div>
          <div className="flex items-center gap-4">
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
    return <Navigate to="/transactions" replace />
  }
  return <Navigate to="/transactions" replace />
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
