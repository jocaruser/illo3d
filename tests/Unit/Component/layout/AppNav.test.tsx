import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppNav } from '@/Component/layout/AppNav'
import { renderLayout } from './renderLayout'

describe('AppNav', () => {
  it('links every section', () => {
    renderLayout(<AppNav />)

    for (const name of ['Dashboard', 'Clients', 'Jobs', 'Transactions', 'Inventory', 'Audit Log']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('marks the current section', () => {
    renderLayout(<AppNav />, ['/clients'])

    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Jobs' })).not.toHaveAttribute('aria-current')
  })

  it.each([
    ['/jobs/J1', 'Jobs'],
    ['/transactions/T1', 'Transactions'],
    ['/clients/CL1', 'Clients'],
    ['/inventory/INV1', 'Inventory'],
  ])('keeps the section active on its detail route %s', (path, name) => {
    renderLayout(<AppNav />, [path])

    expect(screen.getByRole('link', { name })).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark a section whose name merely prefixes the route', () => {
    renderLayout(<AppNav />, ['/jobsomething'])

    expect(screen.getByRole('link', { name: 'Jobs' })).not.toHaveAttribute('aria-current')
  })

  it('marks nothing on an unknown route', () => {
    renderLayout(<AppNav />, ['/nowhere'])

    expect(screen.queryByRole('link', { current: 'page' })).not.toBeInTheDocument()
  })

  it('reports navigation so the mobile sheet can close', async () => {
    const onNavigate = vi.fn()
    renderLayout(<AppNav orientation="vertical" onNavigate={onNavigate} />)

    await userEvent.click(screen.getByRole('link', { name: 'Jobs' }))

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('stacks vertically when asked', () => {
    renderLayout(<AppNav orientation="vertical" />)

    expect(screen.getByRole('navigation')).toHaveClass('flex-col')
  })
})
