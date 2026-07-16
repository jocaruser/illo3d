import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WelcomeStep } from '@/Component/wizard/WelcomeStep'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('WelcomeStep', () => {
  it('offers both backends with their trade-offs spelled out', () => {
    renderWithProviders(
      <WelcomeStep onChooseLocal={vi.fn()} onChooseGoogle={vi.fn()} />
    )

    expect(screen.getByRole('heading', { name: 'illo3d' })).toBeInTheDocument()
    expect(
      screen.getByText('Where do you want to store your shop?')
    ).toBeInTheDocument()

    expect(screen.getByTestId('wizard-local-folder')).toHaveTextContent(
      'Local folder'
    )
    expect(screen.getByTestId('wizard-local-folder')).toHaveTextContent(
      'Chrome required'
    )
    expect(screen.getByTestId('wizard-google-drive')).toHaveTextContent(
      'Google Drive'
    )
    expect(screen.getByTestId('wizard-google-drive')).toHaveTextContent(
      'Synced to your Google account'
    )
  })

  it('acts immediately on the local card — no create-or-open detour', async () => {
    const onChooseLocal = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <WelcomeStep onChooseLocal={onChooseLocal} onChooseGoogle={vi.fn()} />
    )

    await user.click(screen.getByTestId('wizard-local-folder'))
    expect(onChooseLocal).toHaveBeenCalledTimes(1)
  })

  it('starts the Google sign-in from the Drive card', async () => {
    const onChooseGoogle = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <WelcomeStep onChooseLocal={vi.fn()} onChooseGoogle={onChooseGoogle} />
    )

    await user.click(screen.getByTestId('wizard-google-drive'))
    expect(onChooseGoogle).toHaveBeenCalledTimes(1)
  })

  it('explains the second-click OAuth quirk', () => {
    renderWithProviders(
      <WelcomeStep onChooseLocal={vi.fn()} onChooseGoogle={vi.fn()} />
    )

    expect(screen.getByText(/click Google Drive again/)).toBeInTheDocument()
  })

  it('locks both cards while the wizard is busy', () => {
    renderWithProviders(
      <WelcomeStep onChooseLocal={vi.fn()} onChooseGoogle={vi.fn()} disabled />
    )

    expect(screen.getByTestId('wizard-local-folder')).toBeDisabled()
    expect(screen.getByTestId('wizard-google-drive')).toBeDisabled()
  })
})
