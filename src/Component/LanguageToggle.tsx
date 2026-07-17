import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { SUPPORTED_LANGUAGES, type Language } from '@/I18n'
import { useUserPreferencesStore } from '@/Store/userPreferencesStore'

const LABELS: Record<Language, string> = { en: 'EN', es: 'ES' }

/**
 * Compact EN/ES switch, usable before a shop exists (welcome screen,
 * migration wizard) and anywhere else a full profile menu is unavailable.
 * Writes the same preference the profile menu edits.
 */
export function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const language = useUserPreferencesStore((state) => state.language)
  const setLanguage = useUserPreferencesStore((state) => state.setLanguage)

  const choose = (next: Language) => {
    setLanguage(next)
    void i18n.changeLanguage(next)
  }

  return (
    <div
      role="group"
      aria-label={t('profileMenu.language')}
      className="inline-flex overflow-hidden rounded-md border border-border"
    >
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          data-testid={`language-toggle-${code}`}
          disabled={language === code}
          aria-pressed={language === code}
          onClick={() => choose(code)}
          className={cx(
            'px-3 py-1 text-xs font-semibold tracking-wide transition-colors',
            language === code
              ? 'bg-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:bg-surface'
          )}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  )
}
