import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppHeader } from '@/Component/layout/AppHeader'
import { useShopLogoUrl } from '@/Hook/useShopLogoUrl'
import { useShopStore } from '@/Store/shopStore'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'
import { renderLayout } from './renderLayout'

vi.mock('@/Hook/useShopLogoUrl', () => ({ useShopLogoUrl: vi.fn() }))

vi.mock('@/Hook/useShopMetadata', () => ({
  useShopMetadata: () => ({ metadata: null, loading: false, error: null }),
}))

vi.mock('@/Hook/useWorkbookService', () => ({
  useWorkbookService: () => ({
    hydrate: vi.fn(),
    refresh: vi.fn(),
    confirmRefresh: vi.fn(),
    cancelRefresh: vi.fn(),
    save: vi.fn(),
    needsConfirm: false,
    dirty: false,
    status: 'ready',
    ready: true,
  }),
}))

vi.mock('@/Component/layout/GlobalSearchBox', () => ({
  GlobalSearchBox: () => <div data-testid="global-header-search" />,
}))

function openShop() {
  useShopStore.getState().setActiveShop({
    folderId: 'folder-1',
    folderName: 'Shop',
    spreadsheetId: 'sheet-1',
    metadataVersion: '3.0.0',
  })
}

describe('AppHeader', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    vi.mocked(useShopLogoUrl).mockReturnValue(null)
    useShopStore.getState().clearActiveShop()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('wordmark and logo', () => {
    it('links the wordmark home', () => {
      renderLayout(<AppHeader />)

      expect(screen.getByRole('link', { name: 'illo3d' })).toHaveAttribute(
        'href',
        '/'
      )
    })

    it('shows no logo when the shop has none', () => {
      renderLayout(<AppHeader />)

      expect(screen.queryByTestId('shop-logo')).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'illo3d' })).toBeInTheDocument()
    })

    it('shows the shop logo as decoration beside the wordmark', () => {
      vi.mocked(useShopLogoUrl).mockReturnValue('blob:logo')

      renderLayout(<AppHeader />)

      const logo = screen.getByTestId('shop-logo')
      expect(logo).toHaveAttribute('src', 'blob:logo')
      expect(logo).toHaveAttribute('alt', '')
      expect(logo).toHaveAttribute('aria-hidden', 'true')
      expect(logo).toHaveClass('h-8')
    })

    it('drops a logo that fails to load', () => {
      vi.mocked(useShopLogoUrl).mockReturnValue('blob:broken')
      renderLayout(<AppHeader />)

      fireEvent.error(screen.getByTestId('shop-logo'))

      expect(screen.queryByTestId('shop-logo')).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'illo3d' })).toBeInTheDocument()
    })
  })

  describe('search', () => {
    it('is offered only once a shop is open', () => {
      renderLayout(<AppHeader />)

      expect(
        screen.queryByTestId('global-header-search')
      ).not.toBeInTheDocument()
    })

    it('appears with an open shop', () => {
      openShop()

      renderLayout(<AppHeader />)

      expect(screen.getByTestId('global-header-search')).toBeInTheDocument()
    })
  })

  describe('mobile menu', () => {
    it('starts collapsed', () => {
      renderLayout(<AppHeader />)

      expect(screen.getByTestId('nav-toggle')).toHaveAttribute(
        'aria-expanded',
        'false'
      )
      expect(document.getElementById('app-nav-mobile')).toBeNull()
    })

    it('opens the nav and reports it', async () => {
      renderLayout(<AppHeader />)

      await userEvent.click(screen.getByTestId('nav-toggle'))

      expect(screen.getByTestId('nav-toggle')).toHaveAttribute(
        'aria-expanded',
        'true'
      )
      const mobileNav = document.getElementById('app-nav-mobile') as HTMLElement
      expect(
        within(mobileNav).getByRole('link', { name: 'Clients' })
      ).toBeInTheDocument()
    })

    it('closes again on a second press', async () => {
      renderLayout(<AppHeader />)

      await userEvent.click(screen.getByTestId('nav-toggle'))
      await userEvent.click(screen.getByTestId('nav-toggle'))

      expect(document.getElementById('app-nav-mobile')).toBeNull()
    })

    it('closes when a section is chosen', async () => {
      renderLayout(<AppHeader />)
      await userEvent.click(screen.getByTestId('nav-toggle'))
      const mobileNav = document.getElementById('app-nav-mobile') as HTMLElement

      await userEvent.click(
        within(mobileNav).getByRole('link', { name: 'Jobs' })
      )

      expect(document.getElementById('app-nav-mobile')).toBeNull()
    })
  })

  it('gives the workbook actions their own row on mobile', () => {
    renderLayout(<AppHeader />)

    for (const testId of [
      'workbook-actions-desktop',
      'workbook-actions-mobile',
    ]) {
      const row = within(screen.getByTestId(testId))
      expect(row.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      expect(row.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    }
  })
})
