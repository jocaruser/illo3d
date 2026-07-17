import { screen } from '@testing-library/react'
import { AlertStrip } from '@/Component/AlertStrip'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('AlertStrip', () => {
  it('renders a thin strip with the info variant by default', () => {
    renderWithProviders(<AlertStrip>FYI</AlertStrip>)
    expect(screen.getByRole('status')).toHaveClass('border-l-4', 'text-accent')
  })

  it('renders danger as an alert with merged classes', () => {
    renderWithProviders(
      <AlertStrip variant="danger" className="mb-2">
        Broken
      </AlertStrip>
    )
    expect(screen.getByRole('alert')).toHaveClass('text-danger', 'mb-2')
  })
})
