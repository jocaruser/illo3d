import { screen, within } from '@testing-library/react'
import { BreadcrumbBar } from '@/Component/layout/BreadcrumbBar'
import { renderLayout } from './renderLayout'

function crumbs(): string[] {
  return within(screen.getByRole('navigation', { name: 'Breadcrumb' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent?.replace(/^\//, '') ?? '')
}

describe('BreadcrumbBar', () => {
  it('shows Home and the section on a list route', () => {
    renderLayout(<BreadcrumbBar />, ['/clients'])

    expect(crumbs()).toEqual(['Home', 'Clients'])
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/'
    )
  })

  it('links the section and shows the id on a detail route', () => {
    renderLayout(<BreadcrumbBar />, ['/clients/CL1'])

    expect(crumbs()).toEqual(['Home', 'Clients', 'CL1'])
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute(
      'href',
      '/clients'
    )
  })

  it('leaves the section as plain text when it is the current page', () => {
    renderLayout(<BreadcrumbBar />, ['/clients'])

    expect(
      screen.queryByRole('link', { name: 'Clients' })
    ).not.toBeInTheDocument()
  })

  it('translates every known section', () => {
    renderLayout(<BreadcrumbBar />, ['/audit-log'])

    expect(crumbs()).toEqual(['Home', 'Audit Log'])
  })

  it('shows only Home on an unknown route', () => {
    renderLayout(<BreadcrumbBar />, ['/nowhere'])

    expect(crumbs()).toEqual(['Home'])
  })

  it('shows only Home at the root', () => {
    renderLayout(<BreadcrumbBar />, ['/'])

    expect(crumbs()).toEqual(['Home'])
  })

  it('decodes an escaped id', () => {
    renderLayout(<BreadcrumbBar />, ['/jobs/J%201'])

    expect(crumbs()).toEqual(['Home', 'Jobs', 'J 1'])
  })
})
