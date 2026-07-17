import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, beforeEach } from 'vitest'
import { ThemeToggle } from '@/Component/ThemeToggle'
import { initI18n } from '@/I18n'
import { useUserPreferencesStore } from '@/Store/userPreferencesStore'

const i18n = initI18n('en')

function renderToggle() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeToggle />
    </I18nextProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    useUserPreferencesStore.setState({ theme: 'light' })
    document.documentElement.classList.remove('dark')
  })

  it('marks the active theme pressed and disabled', () => {
    renderToggle()
    expect(screen.getByTestId('theme-toggle-light')).toBeDisabled()
    expect(screen.getByTestId('theme-toggle-light')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByTestId('theme-toggle-dark')).toBeEnabled()
  })

  it('switches the preference and applies the theme class', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByTestId('theme-toggle-dark'))

    expect(useUserPreferencesStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByTestId('theme-toggle-dark')).toBeDisabled()
  })

  it('exposes accessible labels for the group and each button', () => {
    renderToggle()
    expect(screen.getByRole('group')).toHaveAccessibleName('Theme')
    expect(screen.getByTestId('theme-toggle-light')).toHaveAccessibleName('Light mode')
    expect(screen.getByTestId('theme-toggle-dark')).toHaveAccessibleName('Dark mode')
  })
})
