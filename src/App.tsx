import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthStatus } from './components/AuthStatus'
import { TransactionsPage } from './pages/TransactionsPage'

function Layout({ children }: { children: React.ReactNode }) {
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
    </div>
  )
}

function Home() {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-600">Welcome to illo3d</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
