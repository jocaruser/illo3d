/* eslint-disable react-refresh/only-export-components --
 * This is the route table, not a component module: exporting `routes`
 * alongside the redirect/not-found elements is the whole point of the file.
 */
import { lazy, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, type RouteObject } from 'react-router-dom'
import { NotFoundCard } from '@/Component/NotFoundCard'
import { AppLayout } from '@/Component/layout/AppLayout'
import { ProtectedPage } from '@/Component/layout/ProtectedPage'

/*
 * Page controllers are code-split: with the setup wizard gating every route,
 * a first-time visitor should not download pages they cannot open yet.
 */
const DashboardPage = lazy(async () => ({
  default: (await import('@/Controller/DashboardPage')).DashboardPage,
}))
const ClientsPage = lazy(async () => ({
  default: (await import('@/Controller/ClientsPage')).ClientsPage,
}))
const ClientDetailPage = lazy(async () => ({
  default: (await import('@/Controller/ClientDetailPage')).ClientDetailPage,
}))
const JobsPage = lazy(async () => ({
  default: (await import('@/Controller/JobsPage')).JobsPage,
}))
const JobDetailPage = lazy(async () => ({
  default: (await import('@/Controller/JobDetailPage')).JobDetailPage,
}))
const TransactionsPage = lazy(async () => ({
  default: (await import('@/Controller/TransactionsPage')).TransactionsPage,
}))
const ExpenseTransactionDetailPage = lazy(async () => ({
  default: (await import('@/Controller/ExpenseTransactionDetailPage'))
    .ExpenseTransactionDetailPage,
}))
const InventoryPage = lazy(async () => ({
  default: (await import('@/Controller/InventoryPage')).InventoryPage,
}))
const InventoryDetailPage = lazy(async () => ({
  default: (await import('@/Controller/InventoryDetailPage'))
    .InventoryDetailPage,
}))
const AuditLogPage = lazy(async () => ({
  default: (await import('@/Controller/AuditLogPage')).AuditLogPage,
}))

/** v2 signed users in at `/login`; v3 has no login page — the wizard covers it. */
function RootRedirect() {
  return <Navigate to="/dashboard" replace />
}

function NotFoundRoute() {
  const { t } = useTranslation()
  return (
    <NotFoundCard
      message={t('page.notFoundMessage')}
      backTo="/dashboard"
      backLabel={t('page.backToDashboard')}
    />
  )
}

function page(element: ReactNode): ReactNode {
  return <ProtectedPage>{element}</ProtectedPage>
}

/**
 * The route table, mounted on a **hash** router (`src/Kernel.tsx`): GitHub
 * Pages serves no rewrite rules, so deep links must live in the fragment.
 * See ARCHITECTURE.md, "Platform constraint: GitHub Pages".
 */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <Navigate to="/" replace /> },
      { path: '/', element: <RootRedirect /> },
      { path: '/dashboard', element: page(<DashboardPage />) },
      { path: '/clients', element: page(<ClientsPage />) },
      { path: '/clients/:clientId', element: page(<ClientDetailPage />) },
      { path: '/jobs', element: page(<JobsPage />) },
      { path: '/jobs/:jobId', element: page(<JobDetailPage />) },
      { path: '/transactions', element: page(<TransactionsPage />) },
      {
        path: '/transactions/:transactionId',
        element: page(<ExpenseTransactionDetailPage />),
      },
      { path: '/expenses', element: <Navigate to="/transactions" replace /> },
      { path: '/inventory', element: page(<InventoryPage />) },
      {
        path: '/inventory/:inventoryId',
        element: page(<InventoryDetailPage />),
      },
      { path: '/audit-log', element: page(<AuditLogPage />) },
      { path: '*', element: page(<NotFoundRoute />) },
    ],
  },
]
