import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Breadcrumbs } from './Breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders links for non-final segments and current page without link', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          ariaLabel="Trail"
          items={[
            { label: 'Home', to: '/transactions' },
            { label: 'Clients' },
          ]}
        />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Trail' })
    expect(nav).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/transactions')

    const current = screen.getByText('Clients')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('renders a single current page segment', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs ariaLabel="Trail" items={[{ label: 'Transactions' }]} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Transactions')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
