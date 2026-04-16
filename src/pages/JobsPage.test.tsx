import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JobsPage } from './JobsPage'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { SHEET_HEADERS } from '@/services/sheets/config'
import { updateJobStatus } from '@/services/job/updateJobStatus'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/services/job/updateJobStatus', () => ({
  updateJobStatus: vi.fn().mockResolvedValue(undefined),
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
    vi.mocked(updateJobStatus).mockClear()
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
      ['J1', 'CL1', 'Widget', 'draft', '', '', '2025-01-01', '', ''],
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

  it('asks for confirmation when leaving paid status', async () => {
    useWorkbookStore.setState({
      tabs: {
        clients: [
          [...SHEET_HEADERS.clients],
          ['CL1', 'Acme', '', '', '', '', '', '', '2025-01-01', '', ''],
        ],
        jobs: [
          [...SHEET_HEADERS.jobs],
          ['JX', 'CL1', 'Paid job', 'paid', '10', '', '2025-01-01', '', ''],
        ],
      },
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    fireEvent.change(document.querySelector('#job-status-JX') as HTMLSelectElement, {
      target: { value: 'delivered' },
    })

    expect(
      screen.getByRole('heading', { name: 'jobs.confirmLeavePaidTitle' })
    ).toBeInTheDocument()
    expect(screen.getByText(/jobs.confirmLeavePaidMessage/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'jobs.confirm' }))

    await waitFor(() => {
      expect(updateJobStatus).toHaveBeenCalledWith(
        'csv-fixture-happy-path',
        expect.objectContaining({ id: 'JX', status: 'paid' }),
        'delivered',
        undefined
      )
    })
  })
})
