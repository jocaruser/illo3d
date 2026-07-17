import { render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/Component/layout/AppLayout'
import { useShopStore } from '@/Store/shopStore'
import { useUserPreferencesStore } from '@/Store/userPreferencesStore'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'
import { i18n } from './renderLayout'

vi.mock('@/Component/wizard/SetupWizard', () => ({
  SetupWizard: () => <div data-testid="setup-wizard">wizard</div>,
}))

vi.mock('@/Component/layout/AppHeader', () => ({
  AppHeader: () => <header data-testid="app-header" />,
}))

vi.mock('@/Component/layout/FaviconUpdater', () => ({
  FaviconUpdater: () => <div data-testid="favicon-updater" />,
}))

vi.mock('@/Component/layout/WorkbookBootstrap', () => ({
  WorkbookBootstrap: () => null,
}))

vi.mock('sonner', () => ({
  Toaster: ({ theme }: { theme: string }) => (
    <div data-testid="toaster" data-theme={theme} />
  ),
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}))

function renderLayoutShell() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<p>page content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
}

function openShop() {
  useShopStore.getState().setActiveShop({
    folderId: 'folder-1',
    folderName: 'Shop',
    spreadsheetId: 'sheet-1',
    metadataVersion: '3.0.0',
  })
}

describe('AppLayout', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    useShopStore.getState().clearActiveShop()
    useUserPreferencesStore.setState({ language: 'en', theme: 'light' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('frames the routed page with the app chrome', () => {
    openShop()

    renderLayoutShell()

    expect(screen.getByTestId('app-header')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' })
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByText('page content')
    ).toBeInTheDocument()
    expect(screen.getByTestId('favicon-updater')).toBeInTheDocument()
  })

  it('blocks the app with the setup wizard until a shop is open', () => {
    renderLayoutShell()

    expect(screen.getByTestId('setup-wizard-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('setup-wizard')).toBeInTheDocument()
  })

  it('drops the wizard once a shop is open', () => {
    openShop()

    renderLayoutShell()

    expect(screen.queryByTestId('setup-wizard-overlay')).not.toBeInTheDocument()
  })

  it('themes the toaster from the user preferences', () => {
    useUserPreferencesStore.setState({ theme: 'dark' })

    renderLayoutShell()

    expect(screen.getByTestId('toaster')).toHaveAttribute('data-theme', 'dark')
  })
})
