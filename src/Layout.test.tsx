import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './App'
import { useAuthStore } from './stores/authStore'
import { useShopStore } from './stores/shopStore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('Layout', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient()
    useAuthStore.setState({
      isAuthenticated: true,
      user: { email: 'a@b.com', name: 'Test' },
      credentials: { accessToken: 'token' },
    })
    useShopStore.setState({
      activeShop: {
        folderId: 'f',
        folderName: 'Shop',
        spreadsheetId: 's',
        metadataVersion: '1.0.0',
      },
    })
  })

  it('marks the active section link with aria-current', () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/jobs']}>
          <Routes>
            <Route
              path="/jobs"
              element={
                <Layout>
                  <div>content</div>
                </Layout>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('link', { name: 'nav.jobs' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'nav.clients' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('shows breadcrumbs on main routes', () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/expenses']}>
          <Routes>
            <Route
              path="/expenses"
              element={
                <Layout>
                  <div>content</div>
                </Layout>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const breadcrumbNav = screen.getByRole('navigation', {
      name: 'breadcrumb.ariaLabel',
    })
    expect(breadcrumbNav).toBeInTheDocument()
    expect(
      within(breadcrumbNav).getByText('nav.expenses'),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('shows breadcrumbs on job detail route', () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/jobs/J1']}>
          <Routes>
            <Route
              path="/jobs/:jobId"
              element={
                <Layout>
                  <div>content</div>
                </Layout>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const breadcrumbNav = screen.getByRole('navigation', {
      name: 'breadcrumb.ariaLabel',
    })
    expect(within(breadcrumbNav).getByText('J1')).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('marks Jobs nav active on job detail path', () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/jobs/J1']}>
          <Routes>
            <Route
              path="/jobs/:jobId"
              element={
                <Layout>
                  <div>content</div>
                </Layout>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const jobsLinks = screen.getAllByRole('link', { name: 'nav.jobs' })
    expect(jobsLinks[0]).toHaveAttribute('aria-current', 'page')
  })
})
