// TODO: Rewrite for v2.0.0 complete flow (removed status dropdown)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JobsPage } from './JobsPage'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { SHEET_HEADERS } from '@/services/sheets/config'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <JobsPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('JobsPage', () => {
  beforeEach(() => {
    useShopStore.setState({
      activeShop: {
        folderId: 'happy-path',
        folderName: 'happy-path',
        spreadsheetId: 'csv-fixture-happy-path',
        metadataVersion: '2.0.0',
      },
    })
    useWorkbookStore.getState().reset()
    const clientsMatrix = [
      [...SHEET_HEADERS.clients],
      ['CL1', 'Acme', '', '', '', '', '', '', '2025-01-01', '', ''],
    ]
    const jobsMatrix = [
      [...SHEET_HEADERS.jobs],
      ['J1', 'CL1', 'Widget', '', '', '2025-01-01', '', '', '', ''],
    ]
    useWorkbookStore.setState({
      status: 'ready',
      spreadsheetId: 'csv-fixture-happy-path',
      error: null,
      tabs: {
        clients: clientsMatrix,
        jobs: jobsMatrix,
      },
    })
  })

  it('shows jobs title and table when workbook is ready', async () => {
    renderPage()

    expect(screen.getByText('jobs.title')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('Widget')).toBeInTheDocument()
  })

  it('shows empty state when there are no jobs', async () => {
    useWorkbookStore.setState({
      tabs: {
        clients: [
          [...SHEET_HEADERS.clients],
          ['CL1', 'Acme', '', '', '', '', '', '', '2025-01-01', '', ''],
        ],
        jobs: [[...SHEET_HEADERS.jobs]],
      },
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('jobs.empty')).toBeInTheDocument()
    })
  })
})