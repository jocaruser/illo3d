import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { useUserPreferencesStore, type Theme } from '@/Store/userPreferencesStore'
import { applyTheme } from '@/Theme/initTheme'

const THEMES: readonly Theme[] = ['light', 'dark']

/**
 * Compact light/dark switch, usable before a shop exists (welcome screen,
 * migration wizard) and anywhere else a full profile menu is unavailable.
 * Writes the same preference the profile menu edits.
 */
export function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useUserPreferencesStore((state) => state.theme)
  const setTheme = useUserPreferencesStore((state) => state.setTheme)

  const choose = (next: Theme) => {
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div
      role="group"
      aria-label={t('profileMenu.theme')}
      className="inline-flex overflow-hidden rounded-md border border-border"
    >
      {THEMES.map((code) => (
        <button
          key={code}
          type="button"
          data-testid={`theme-toggle-${code}`}
          disabled={theme === code}
          aria-pressed={theme === code}
          onClick={() => choose(code)}
          className={cx(
            'px-3 py-1 transition-colors',
            theme === code
              ? 'bg-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:bg-surface'
          )}
        >
          {code === 'light' ? (
            <SunIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <MoonIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  )
}
