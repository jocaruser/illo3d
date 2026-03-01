import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthStatus } from './components/AuthStatus'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SetupWizard } from './components/wizard/SetupWizard'
import { LoginPage } from './pages/LoginPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { useAuthStore } from './stores/authStore'
import { useShopStore } from './stores/shopStore'

function Layout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const activeShop = useShopStore((s) => s.activeShop)
  const logout = useAuthStore((s) => s.logout)
  const clearActiveShop = useShopStore((s) => s.clearActiveShop)

  const handleWizardCancel = () => {
    clearActiveShop()
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-gray-800">
              illo3d
            </Link>
            <Link
              to="/transactions"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Transactions
            </Link>
          </div>
          <AuthStatus />
        </div>
      </header>
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
          path="/transactions"
          element={
            <Layout>
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
