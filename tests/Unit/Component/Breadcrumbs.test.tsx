import { screen } from '@testing-library/react'
import { Breadcrumbs } from '@/Component/Breadcrumbs'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('Breadcrumbs', () => {
  it('renders an accessible nav with links and a current page', () => {
    renderWithProviders(
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Section' },
          { label: 'Clients', to: '/clients' },
          { label: 'ACME' },
        ]}
      />
    )

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/clients')

    const middle = screen.getByText('Section')
    expect(middle.tagName).toBe('SPAN')
    expect(middle).not.toHaveClass('font-medium')

    const last = screen.getByText('ACME')
    expect(last.tagName).toBe('SPAN')
    expect(last).toHaveClass('font-medium')
    expect(last.closest('li')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Home').closest('li')).not.toHaveAttribute('aria-current')
  })

  it('never links the last item, even when it has a target', () => {
    renderWithProviders(<Breadcrumbs items={[{ label: 'Only', to: '/only' }]} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Only').closest('li')).toHaveAttribute('aria-current', 'page')
  })
})
