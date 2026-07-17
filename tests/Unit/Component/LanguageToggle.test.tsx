import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, beforeEach } from 'vitest'
import { LanguageToggle } from '@/Component/LanguageToggle'
import { initI18n } from '@/I18n'
import { useUserPreferencesStore } from '@/Store/userPreferencesStore'

const i18n = initI18n('en')

function renderToggle() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageToggle />
    </I18nextProvider>
  )
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    useUserPreferencesStore.setState({ language: 'en' })
    void i18n.changeLanguage('en')
  })

  it('marks the active language pressed and disabled', () => {
    renderToggle()
    expect(screen.getByTestId('language-toggle-en')).toBeDisabled()
    expect(screen.getByTestId('language-toggle-en')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByTestId('language-toggle-es')).toBeEnabled()
  })

  it('switches the preference and the live language', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByTestId('language-toggle-es'))

    expect(useUserPreferencesStore.getState().language).toBe('es')
    expect(i18n.language).toBe('es')
    expect(screen.getByTestId('language-toggle-es')).toBeDisabled()
  })

  it('exposes an accessible group label', () => {
    renderToggle()
    expect(screen.getByRole('group')).toHaveAccessibleName('Language')
  })
})
