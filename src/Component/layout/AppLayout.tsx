import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppHeader } from '@/Component/layout/AppHeader'
import { BlockingOverlay } from '@/Component/layout/BlockingOverlay'
import { BreadcrumbBar } from '@/Component/layout/BreadcrumbBar'
import { FaviconUpdater } from '@/Component/layout/FaviconUpdater'
import { GoogleSessionBanner } from '@/Component/layout/GoogleSessionBanner'
import { OperationToast } from '@/Component/layout/OperationToast'
import { WorkbookBootstrap } from '@/Component/layout/WorkbookBootstrap'
import { SetupWizard } from '@/Component/wizard/SetupWizard'
import { useShopStore } from '@/Store/shopStore'
import { useUserPreferencesStore } from '@/Store/userPreferencesStore'

/**
 * The shell every route renders inside. With no shop open the setup wizard
 * covers the app as a modal overlay rather than a redirect, so the requested
 * URL survives the wizard and pages resume where the user aimed.
 */
export function AppLayout() {
  const activeShop = useShopStore((state) => state.activeShop)
  const theme = useUserPreferencesStore((state) => state.theme)

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppHeader />
      <GoogleSessionBanner />
      <BreadcrumbBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Toaster theme={theme} position="bottom-right" richColors closeButton />
      <BlockingOverlay />
      <OperationToast />
      <FaviconUpdater />
      <WorkbookBootstrap />

      {activeShop === null && (
        <div
          data-testid="setup-wizard-overlay"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-surface p-4"
        >
          <SetupWizard />
        </div>
      )}
    </div>
  )
}
