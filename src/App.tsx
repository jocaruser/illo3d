import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthStatus } from './components/AuthStatus'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">illo3d</h1>
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
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
