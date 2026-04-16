import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreateExpensePopup } from '@/components/CreateExpensePopup'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { useJobStatusFlow } from '@/hooks/useJobStatusFlow'
import { StatCard } from '@/components/dashboard/StatCard'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts'
import { RecentList, type RecentListItem } from '@/components/dashboard/RecentList'
import { calculateBalance, formatCurrency } from '@/utils/money'
import {
  countActiveJobs,
  revenueThisMonth,
  countPiecesCompletedThisWeek,
} from '@/utils/dashboardStats'
import type { Expense, JobStatus, Transaction } from '@/types/money'
import {
  applyKanbanBoardOrderAfterStatusCommit,
  applyKanbanDrop,
} from '@/services/job/applyKanbanDrop'

function isActiveTransaction(txn: Transaction): boolean {
  return txn.archived !== 'true' && txn.deleted !== 'true'
}

function isActiveExpense(e: Expense): boolean {
  return e.archived !== 'true' && e.deleted !== 'true'
}

type PendingKanbanPlacement = {
  fromStatus: JobStatus
  targetStatus: JobStatus
  jobId: string
  insertBeforeId: string | null
}

export function DashboardPage() {
  const { t } = useTranslation()
  const [expensePopupOpen, setExpensePopupOpen] = useState(false)
  const [jobPopupOpen, setJobPopupOpen] = useState(false)
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookError = useWorkbookStore((s) => s.error)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)
  const pendingKanbanPlacementRef = useRef<PendingKanbanPlacement | null>(null)
  const {
    handleStatusSelect,
    statusError,
    statusUpdatingId,
    statusDialogs,
  } = useJobStatusFlow(spreadsheetId, {
    afterStatusCommit: (job) => {
      const p = pendingKanbanPlacementRef.current
      if (!p || p.jobId !== job.id) return
      applyKanbanBoardOrderAfterStatusCommit(
        p.fromStatus,
        p.targetStatus,
        job.id,
        p.insertBeforeId,
      )
      pendingKanbanPlacementRef.current = null
    },
    onStatusFlowCancelled: () => {
      pendingKanbanPlacementRef.current = null
    },
    onStatusCommitError: () => {
      pendingKanbanPlacementRef.current = null
    },
  })

  const {
    jobs,
    clients,
    transactions: allTransactions,
    expenses: allExpenses,
    inventory,
    pieces,
  } = useWorkbookEntities()

  const transactions = useMemo(
    () => allTransactions.filter(isActiveTransaction),
    [allTransactions],
  )

  const expenses = useMemo(
    () => allExpenses.filter(isActiveExpense),
    [allExpenses],
  )

  const clientsById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of clients) {
      if (c.archived === 'true' || c.deleted === 'true') continue
      m.set(c.id, c.name)
    }
    return m
  }, [clients])

  const balance = useMemo(
    () => calculateBalance(transactions.map((tx) => tx.amount)),
    [transactions],
  )

  const activeJobCount = useMemo(() => countActiveJobs(jobs), [jobs])
  const monthRevenue = useMemo(() => revenueThisMonth(transactions), [transactions])
  const piecesWeek = useMemo(
    () => countPiecesCompletedThisWeek(pieces),
    [pieces],
  )

  const recentTransactionRows: RecentListItem[] = useMemo(
    () =>
      transactions.map((tx) => ({
        date: tx.date,
        label: tx.concept,
        amount: tx.amount,
      })),
    [transactions],
  )

  const recentExpenseRows: RecentListItem[] = useMemo(
    () =>
      expenses.map((exp) => {
        const notesTrim = (exp.notes ?? '').trim()
        const label =
          notesTrim !== '' ? notesTrim : t(`expenses.category.${exp.category}`)
        return {
          date: exp.date,
          label,
          amount: -Math.abs(exp.amount),
        }
      }),
    [expenses, t],
  )

  const handleRetry = () => {
    if (!spreadsheetId) return
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        {t('page.dashboard')}
      </h2>

      {spreadsheetId ? (
        <ConnectionStatus
          status={workbookStatus}
          errorMessage={workbookError}
          onRetry={handleRetry}
        />
      ) : null}

      {statusError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800">{statusError}</p>
        </div>
      )}

      {workbookStatus === 'ready' && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setExpensePopupOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('dashboard.addExpense')}
            </button>
            <button
              type="button"
              onClick={() => setJobPopupOpen(true)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {t('dashboard.addJob')}
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('dashboard.balance')}
              value={formatCurrency(balance)}
              to="/transactions"
              valueTone={balance >= 0 ? 'positive' : 'negative'}
            />
            <StatCard
              label={t('dashboard.activeJobs')}
              value={String(activeJobCount)}
            />
            <StatCard
              label={t('dashboard.revenueThisMonth')}
              value={formatCurrency(monthRevenue)}
              to="/transactions"
            />
            <StatCard
              label={t('dashboard.piecesThisWeek')}
              value={String(piecesWeek)}
            />
          </div>

          <section className="mb-8" aria-label={t('page.dashboard')}>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              {t('nav.jobs')}
            </h3>
            <KanbanBoard
              jobs={jobs}
              clientsById={clientsById}
              onJobMoveToStatus={(job, next, insertBeforeId) => {
                if (!spreadsheetId) return
                void (async () => {
                  const result = await applyKanbanDrop(
                    spreadsheetId,
                    job.id,
                    next,
                    insertBeforeId,
                  )
                  if (result === 'needs-dialog') {
                    pendingKanbanPlacementRef.current = {
                      fromStatus: job.status,
                      targetStatus: next,
                      jobId: job.id,
                      insertBeforeId,
                    }
                    void handleStatusSelect(job, next)
                  }
                })()
              }}
              statusUpdatingId={statusUpdatingId}
            />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <InventoryAlerts items={inventory} />
            <RecentList
              items={recentTransactionRows}
              title={t('dashboard.recentTransactions')}
              viewAllTo="/transactions"
            />
            <RecentList
              items={recentExpenseRows}
              title={t('dashboard.recentExpenses')}
              viewAllTo="/expenses"
            />
          </div>
        </>
      )}

      <CreateExpensePopup
        isOpen={expensePopupOpen}
        onClose={() => setExpensePopupOpen(false)}
        onSuccess={() => setExpensePopupOpen(false)}
        spreadsheetId={spreadsheetId}
      />
      <CreateJobPopup
        isOpen={jobPopupOpen}
        onClose={() => setJobPopupOpen(false)}
        onSuccess={() => setJobPopupOpen(false)}
        spreadsheetId={spreadsheetId}
        clients={clients}
      />
      {statusDialogs}
    </div>
  )
}
