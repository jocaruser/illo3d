import { screen } from '@testing-library/react'
import { Card, CardBody, CardHeader, CardTitle } from '@/Component/Card'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('Card', () => {
  it('renders a token-styled panel with header, title, and body', () => {
    renderWithProviders(
      <Card className="extra">
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardBody>Content</CardBody>
      </Card>
    )

    const title = screen.getByRole('heading', { level: 3, name: 'Metrics' })
    expect(title).toHaveClass('font-display')

    const card = screen.getByText('Content').parentElement as HTMLElement
    expect(card).toHaveClass('bg-surface-elevated', 'border-border', 'extra')
    expect(card).not.toHaveClass('card-hover-lift')
    expect(title.parentElement).toHaveClass('border-b')
    expect(screen.getByText('Content')).toHaveClass('p-4')
  })

  it('adds the lift effect for the interactive variant', () => {
    renderWithProviders(
      <Card interactive>
        <CardBody>Lift me</CardBody>
      </Card>
    )
    expect(screen.getByText('Lift me').parentElement).toHaveClass('card-hover-lift')
  })
})
