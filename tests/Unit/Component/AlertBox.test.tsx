import { screen } from '@testing-library/react'
import { AlertBox, type AlertVariant } from '@/Component/AlertBox'
import { renderWithProviders } from './helpers/renderWithProviders'

const statusVariants: Array<[AlertVariant, string]> = [
  ['info', 'text-accent'],
  ['success', 'text-success'],
  ['primary', 'text-primary'],
  ['secondary', 'text-text-muted'],
]

const alertVariants: Array<[AlertVariant, string]> = [
  ['warning', 'text-warning'],
  ['danger', 'text-danger'],
]

describe('AlertBox', () => {
  it.each(statusVariants)('renders the %s variant as a status', (variant, textClass) => {
    renderWithProviders(<AlertBox variant={variant}>Heads up</AlertBox>)
    expect(screen.getByRole('status')).toHaveClass(textClass, 'rounded-md', 'border')
  })

  it.each(alertVariants)('renders the %s variant as an alert', (variant, textClass) => {
    renderWithProviders(<AlertBox variant={variant}>Watch out</AlertBox>)
    expect(screen.getByRole('alert')).toHaveClass(textClass)
  })

  it('defaults to the info variant and merges custom classes', () => {
    renderWithProviders(<AlertBox className="mt-2">Note</AlertBox>)
    expect(screen.getByRole('status')).toHaveClass('text-accent', 'mt-2')
  })
})
