import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { CreatePurchasePopup } from '@/components/CreatePurchasePopup'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { useJobStatusFlow } from '@/hooks/useJobStatusFlow'
import { useShopMetadata } from '@/hooks/useShopMetadata'
import { StatCard } from '@/components/StatCard'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts'
import { RecentList, type RecentListItem } from '@/components/dashboard/RecentList'
import { ExpectedBenefitCard } from '@/components/dashboard/ExpectedBenefitCard'
import { calculateBalance, formatCurrency } from '@/utils/money'
import {
  countActiveJobs,
  revenueThisMonth,
  countPiecesCompletedThisWeek,
} from '@/utils/dashboardStats'
import type { JobStatus } from '@/types/money'
import {
  applyKanbanBoardOrderAfterStatusCommit,
  applyKanbanDrop,
} from '@/services/job/applyKanbanDrop'
import { clearKanbanPendingAfterSelect } from '@/utils/clearKanbanPendingAfterSelect'
import {
  buildExpenseLotLinkMaps,
  getTransactionConceptLink,
} from '@/lib/money/transactionConceptLink'
import { isActiveRow } from '@/lib/entityFilters'

type PendingKanbanPlacement = {
  fromStatus: JobStatus
  targetStatus: JobStatus
  jobId: string
  insertBeforeId: string | null
}

export function DashboardPage() {
  const { t } = useTranslation()
  const [purchasePopupOpen, setPurchasePopupOpen] = useState(false)
  const [jobPopupOpen, setJobPopupOpen] = useState(false)
  const {
    spreadsheetId,
    workbookStatus,
  } = useWorkbookConnection()
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
    inventory,
    pieces,
    pieceItems,
    lots,
  } = useWorkbookEntities()

  const { data: metadata } = useShopMetadata()

  const transactions = useMemo(
    () => allTransactions.filter(isActiveRow),
    [allTransactions],
  )

  const { expenseTxnIdsWithLots } = useMemo(
    () => buildExpenseLotLinkMaps(lots),
    [lots],
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
      transactions.map((tx) => {
        const link = getTransactionConceptLink(tx, expenseTxnIdsWithLots)
        return {
          id: tx.id,
          date: tx.date,
          label: tx.concept,
          amount: tx.amount,
          labelLink: link ?? undefined,
        }
      }),
    [transactions, expenseTxnIdsWithLots],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-text">
        {t('page.dashboard')}
      </h2>


      {statusError && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{statusError}</p>
        </div>
      )}

      {workbookStatus === 'ready' && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPurchasePopupOpen(true)}
              className="btn-primary"
            >
              {t('purchase.recordButton')}
            </button>
            <button
              type="button"
              onClick={() => setJobPopupOpen(true)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
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

          <div className="mb-6">
            <ExpectedBenefitCard
              jobs={jobs}
              pieces={pieces}
              pieceItems={pieceItems}
              inventory={inventory}
              lots={lots}
            />
          </div>

          <section className="mb-8">
            <h3 className="mb-3 text-lg font-semibold text-text">
              {t('nav.jobs')}
            </h3>
            <KanbanBoard
              jobs={jobs}
              pieces={pieces}
              pieceItems={pieceItems}
              inventory={inventory}
              lots={lots}
              clientsById={clientsById}
              kanbanStaleDays={metadata?.kanban?.autoCardsHideAfterXDays}
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
                    const selectResult = await handleStatusSelect(job, next)
                    clearKanbanPendingAfterSelect(
                      selectResult,
                      pendingKanbanPlacementRef,
                    )
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
          </div>
        </>
      )}

      <CreatePurchasePopup
        isOpen={purchasePopupOpen}
        onClose={() => setPurchasePopupOpen(false)}
        onSuccess={() => setPurchasePopupOpen(false)}
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
