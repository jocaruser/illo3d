import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WelcomeStep } from './WelcomeStep'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('WelcomeStep', () => {
  it('renders both backend options and invokes callbacks', () => {
    const onLocal = vi.fn()
    const onGoogle = vi.fn()
    render(<WelcomeStep onSelectLocal={onLocal} onSelectGoogleDrive={onGoogle} />)

    expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-google-drive')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('wizard-local-folder'))
    expect(onLocal).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('wizard-google-drive'))
    expect(onGoogle).toHaveBeenCalledTimes(1)
  })

  it('shows OAuth hint when showGoogleDriveOAuthHint is set', () => {
    render(
      <WelcomeStep
        onSelectLocal={vi.fn()}
        onSelectGoogleDrive={vi.fn()}
        showGoogleDriveOAuthHint
      />,
    )

    expect(screen.getByTestId('wizard-google-oauth-hint')).toHaveTextContent(
      'wizard.googleDriveOAuthHint',
    )
  })
})
