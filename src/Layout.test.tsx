import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './App'
import { useAuthStore } from './stores/authStore'
import { useShopStore } from './stores/shopStore'
import { useWorkbookStore } from './stores/workbookStore'
import type { SheetName } from './services/sheets/config'
import { emptySheetMatrix } from './services/sheets/sheetMatrix'

const { mockReadSheetMatrix, mockReplaceSheetMatrix } = vi.hoisted(() => ({
  mockReadSheetMatrix: vi.fn(),
  mockReplaceSheetMatrix: vi.fn(),
}))

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: vi.fn(),
    appendRows: vi.fn(),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
    getSheetNames: vi.fn(),
    getHeaderRow: vi.fn(),
    createSpreadsheet: vi.fn(),
    readSheetMatrix: mockReadSheetMatrix,
    replaceSheetMatrix: mockReplaceSheetMatrix,
    getSheetIdMap: vi.fn(async () => ({})),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('Layout', () => {
  let qc: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockReadSheetMatrix.mockImplementation(async (_id: string, name: SheetName) =>
      emptySheetMatrix(name),
    )
    mockReplaceSheetMatrix.mockResolvedValue(undefined)
    useWorkbookStore.getState().reset()
    qc = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    })
    const sid = 's'
    qc.setQueryData(['clients', sid], [])
    qc.setQueryData(['jobs', sid], [])
    qc.setQueryData(['pieces', sid], [])
    qc.setQueryData(['crm_notes', sid], [])
    qc.setQueryData(['transactions', sid], [])
    qc.setQueryData(['lots', sid], [])
    qc.setQueryData(['inventory', sid], [])
    qc.setQueryData(['tags', sid], [])
    qc.setQueryData(['tag_links', sid], [])
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
        metadataVersion: '2.0.0',
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
        <MemoryRouter initialEntries={['/inventory']}>
          <Routes>
            <Route
              path="/inventory"
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
      within(breadcrumbNav).getByText('nav.inventory'),
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

  it('shows global header search when authenticated with active shop', async () => {
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

    await waitFor(() => {
      expect(screen.getByTestId('global-header-search')).toBeInTheDocument()
    })
  })

  it('shows workbook refresh and save when authenticated with active shop', async () => {
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

    await waitFor(() => {
      expect(screen.getByTestId('workbook-refresh')).not.toBeDisabled()
    })
    expect(screen.getByTestId('workbook-save')).toBeDisabled()
  })

  it('opens discard confirmation when refreshing with a dirty workbook', async () => {
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

    await waitFor(() => {
      expect(screen.getByTestId('workbook-refresh')).not.toBeDisabled()
    })

    act(() => {
      useWorkbookStore.setState({ dirty: true })
    })
    fireEvent.click(screen.getByTestId('workbook-refresh'))

    expect(
      await screen.findByRole('heading', { name: 'workbook.discardTitle' }),
    ).toBeInTheDocument()
    expect(screen.getByText('workbook.discardMessage')).toBeInTheDocument()
  })
})
