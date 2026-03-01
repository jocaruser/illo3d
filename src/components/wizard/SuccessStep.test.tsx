import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SuccessStep } from './SuccessStep'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { name: string }) =>
      key === 'wizard.successMessage' ? `Shop ${params?.name} ready` : key,
  }),
}))

describe('SuccessStep', () => {
  it('renders congratulations and start tour button disabled', () => {
    render(
      <SuccessStep
        folderName="My Shop"
        onContinue={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('wizard.success')).toBeInTheDocument()
    expect(screen.getByText('Shop My Shop ready')).toBeInTheDocument()
    const startTourButton = screen.getByText('wizard.startTour')
    expect(startTourButton).toBeDisabled()
    expect(screen.getByText('wizard.continue')).toBeInTheDocument()
  })

  it('calls onContinue when continue button is clicked', () => {
    const onContinue = vi.fn()
    render(
      <SuccessStep
        folderName="My Shop"
        onContinue={onContinue}
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('wizard.continue'))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
