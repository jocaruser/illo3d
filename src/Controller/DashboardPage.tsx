import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertBox } from '@/Component/AlertBox'
import { CalendarView } from '@/Component/calendar/CalendarView'
import { ExpectedBenefitCard } from '@/Component/dashboard/ExpectedBenefitCard'
import { InventoryAlerts } from '@/Component/dashboard/InventoryAlerts'
import { RecentTransactions } from '@/Component/dashboard/RecentTransactions'
import { StatCards } from '@/Component/dashboard/StatCards'
import { ViewSwitcher, type DashboardView } from '@/Component/dashboard/ViewSwitcher'
import { CreateJobDialog } from '@/Component/detail/CreateJobDialog'
import { CreatePurchaseDialog } from '@/Component/detail/CreatePurchaseDialog'
import { KanbanBoard } from '@/Component/kanban/KanbanBoard'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { LoadingSpinner } from '@/Component/LoadingSpinner'
import { useWorkbookStore } from '@/Store/workbookStore'

/**
 * The shop at a glance: headline numbers, the job board (or the v3 calendar),
 * and the two widgets that catch problems early — low stock and the ledger.
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const status = useWorkbookStore((state) => state.status)
  const error = useWorkbookStore((state) => state.error)
  const [view, setView] = useState<DashboardView>('kanban')
  const [jobDialogOpen, setJobDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)

  const ready = status === 'ready'

  return (
    <div aria-busy={!ready} className="space-y-6">
      {status === 'error' ? (
        <AlertBox variant="danger">{error ?? t('workbook.loadFailed')}</AlertBox>
      ) : !ready ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* The page's h1, matching every other page's title level. */}
            <h1 className="font-display text-2xl font-semibold text-text">{t('page.dashboard')}</h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPurchaseDialogOpen(true)}
              >
                {t('purchase.recordButton')}
              </button>
              <button type="button" className="btn-primary" onClick={() => setJobDialogOpen(true)}>
                {t('dashboard.addJob')}
              </button>
            </div>
          </div>

          <StatCards />

          <ExpectedBenefitCard />

          <section aria-labelledby="dashboard-jobs-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeading id="dashboard-jobs-heading">{t('nav.jobs')}</SectionHeading>
              <ViewSwitcher view={view} onChange={setView} />
            </div>
            <div className="mt-3">{view === 'kanban' ? <KanbanBoard /> : <CalendarView />}</div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InventoryAlerts />
            <RecentTransactions />
          </div>

          <CreateJobDialog
            open={jobDialogOpen}
            onClose={() => setJobDialogOpen(false)}
            onCreated={() => setJobDialogOpen(false)}
          />
          <CreatePurchaseDialog
            open={purchaseDialogOpen}
            onClose={() => setPurchaseDialogOpen(false)}
            onCreated={() => setPurchaseDialogOpen(false)}
          />
        </>
      )}
    </div>
  )
}
