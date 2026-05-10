import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { useShopMetadata } from '@/hooks/useShopMetadata'
import { CreatePurchasePopup } from '@/components/CreatePurchasePopup'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { CalendarView } from '@/components/dashboard/CalendarView'
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts'
import { RecentList, type RecentListItem } from '@/components/dashboard/RecentList'
import { StatCard } from '@/components/StatCard'
import { calculateBalance, formatCurrency } from '@/utils/money'
import {
  revenueThisMonth,
  countPiecesCompletedThisWeek,
} from '@/utils/dashboardStats'
import {
  buildExpenseLotLinkMaps,
  getTransactionConceptLink,
} from '@/lib/money/transactionConceptLink'
import { isActiveRow } from '@/lib/entityFilters'
import { updatePieceStatus } from '@/services/piece/updatePieceStatus'

type ViewType = 'kanban' | 'calendar'

export function DashboardPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [purchasePopupOpen, setPurchasePopupOpen] = useState(false)
  const [jobPopupOpen, setJobPopupOpen] = useState(false)
  const { spreadsheetId, workbookStatus } = useWorkbookConnection()
  const { data: metadata } = useShopMetadata()

  const {
    jobs,
    clients,
    transactions: allTransactions,
    inventory,
    pieces,
    lots,
  } = useWorkbookEntities()

  const transactions = useMemo(
    () => allTransactions.filter(isActiveRow),
    [allTransactions],
  )

  const balance = useMemo(
    () => calculateBalance(transactions.map((tx) => tx.amount)),
    [transactions],
  )

  const activeJobCount = useMemo(
    () => jobs.filter((j) => !j.completed && isActiveRow(j)).length,
    [jobs]
  )
  const monthRevenue = useMemo(() => revenueThisMonth(transactions), [transactions])
  const piecesWeek = useMemo(
    () => countPiecesCompletedThisWeek(pieces),
    [pieces],
  )

  // Build clientsById map for kanban
  const clientsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients) {
      if (isActiveRow(client) && client.name) {
        map.set(client.id, client.name)
      }
    }
    return map
  }, [clients])

  // Get kanban columns from metadata
  const kanbanColumns = metadata?.kanbanColumns ?? []

  // View tabs (kanban/calendar)
  const [activeView, setActiveView] = useState<ViewType>('kanban')
  
  const viewTabs = useMemo(() => {
    return [
      { id: 'kanban' as const, label: t('dashboard.kanban.title', 'Kanban') },
      { id: 'calendar' as const, label: t('page.calendar') },
    ]
  }, [t])

  // Piece updating state
  const [updatingPieceId, setUpdatingPieceId] = useState<string | null>(null)

  // Handle piece status moves and reordering
  const handlePieceMove = async (pieceId: string, newStatus: string, insertBeforeId?: string | null) => {
    if (!spreadsheetId) return
    
    const piece = pieces.find(p => p.id === pieceId)
    if (!piece) return
    
    // If same status and no reordering target, do nothing
    if (piece.status === newStatus && insertBeforeId === undefined) return
    
    setUpdatingPieceId(pieceId)
    try {
      // If status changed, update status
      if (piece.status !== newStatus) {
        await updatePieceStatus(spreadsheetId, piece, newStatus)
      }
      
      // TODO: If insertBeforeId is provided, calculate and update board_order
      // For now, just refresh data
      queryClient.invalidateQueries({ queryKey: ['workbook-entities', spreadsheetId] })
    } catch (err) {
      console.error('Failed to update piece:', err)
    } finally {
      setUpdatingPieceId(null)
    }
  }

  const { expenseTxnIdsWithLots } = useMemo(
    () => buildExpenseLotLinkMaps(lots),
    [lots],
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

  const renderViewContent = () => {
    switch (activeView) {
      case 'kanban':
        return (
          <KanbanBoard
            columns={kanbanColumns}
            jobs={jobs.filter(isActiveRow)}
            pieces={pieces.filter(isActiveRow)}
            clientsById={clientsById}
            onPieceMove={handlePieceMove}
            updatingPieceId={updatingPieceId}
          />
        )
      case 'calendar':
        return <CalendarView />
      default:
        return (
          <KanbanBoard
            columns={kanbanColumns}
            jobs={jobs.filter(isActiveRow)}
            pieces={pieces.filter(isActiveRow)}
            clientsById={clientsById}
            onPieceMove={handlePieceMove}
            updatingPieceId={updatingPieceId}
          />
        )
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header with actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-text">
          {t('page.dashboard')}
        </h2>
        <div className="flex flex-wrap gap-3">
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
      </div>

      {/* Stats Widgets - Always visible */}
      {workbookStatus === 'ready' && (
        <>
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

          {/* View Tabs */}
          <div className="mb-6 border-b border-border">
            <div className="flex gap-1">
              {viewTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeView === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Content (kanban/calendar) */}
          <div className="h-[500px] mb-6">
            {renderViewContent()}
          </div>

          {/* Bottom Widgets */}
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
    </div>
  )
}
