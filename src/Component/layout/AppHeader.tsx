import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useShopLogoUrl } from '@/Hook/useShopLogoUrl'
import { AppNav } from '@/Component/layout/AppNav'
import { GlobalSearchBox } from '@/Component/layout/GlobalSearchBox'
import { ProfileMenu } from '@/Component/layout/ProfileMenu'
import { WorkbookActions } from '@/Component/layout/WorkbookActions'
import { useShopStore } from '@/Store/shopStore'

/**
 * Tints an arbitrary logo to the brand primary (#2563eb). A filter chain is
 * the only way to recolor a raster logo in CSS; `brightness(0)` flattens it to
 * black first so the hue-rotate lands on a known starting color.
 */
const LOGO_TINT_CLASS =
  '[filter:brightness(0)_saturate(100%)_invert(31%)_sepia(93%)_saturate(1352%)_hue-rotate(210deg)_brightness(96%)_contrast(94%)]'

export function AppHeader() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const activeShop = useShopStore((state) => state.activeShop)
  const logoUrl = useShopLogoUrl()
  const showLogo = logoUrl !== null && !logoFailed

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface-elevated">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          data-testid="nav-toggle"
          aria-label={t('nav.toggleMenu')}
          aria-expanded={menuOpen}
          aria-controls="app-nav-mobile"
          className="rounded-md p-2 text-text-muted hover:bg-surface-alt hover:text-text md:hidden"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          {showLogo && (
            <img
              src={logoUrl}
              data-testid="shop-logo"
              alt=""
              aria-hidden="true"
              className={`h-8 w-auto ${LOGO_TINT_CLASS}`}
              onError={() => setLogoFailed(true)}
            />
          )}
          <span className="font-display text-xl font-semibold text-text">illo3d</span>
        </Link>

        <div className="hidden md:flex">
          <AppNav />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div data-testid="workbook-actions-desktop" className="hidden md:block">
            <WorkbookActions />
          </div>
          {activeShop !== null && <GlobalSearchBox />}
          <ProfileMenu />
        </div>
      </div>

      {menuOpen && (
        <div id="app-nav-mobile" className="border-t border-border px-4 py-2 md:hidden">
          <AppNav orientation="vertical" onNavigate={() => setMenuOpen(false)} />
        </div>
      )}

      <div
        data-testid="workbook-actions-mobile"
        className="flex justify-end border-t border-border px-4 py-2 md:hidden"
      >
        <WorkbookActions />
      </div>
    </header>
  )
}
