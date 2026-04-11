import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JobsPage } from './JobsPage'
import { useShopStore } from '@/stores/shopStore'
import { useSheetsStore } from '@/stores/sheetsStore'
import { fetchJobs } from '@/services/sheets/jobs'
import { updateJobStatus } from '@/services/job/updateJobStatus'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/services/sheets/connection', () => ({
  connect: vi.fn().mockResolvedValue({ ok: true, spreadsheetId: 'csv-fixture-happy-path' }),
}))

vi.mock('@/services/sheets/jobs', () => ({
  fetchJobs: vi.fn(),
}))

vi.mock('@/services/sheets/clients', () => ({
  fetchClients: vi.fn().mockResolvedValue([]),
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
        metadataVersion: '1.0.0',
      },
    })
    useSheetsStore.setState({
      status: 'connecting',
      spreadsheetId: null,
      errorMessage: null,
    })
    vi.mocked(fetchJobs).mockResolvedValue([
      {
        id: 'J1',
        client_id: 'CL1',
        description: 'Widget',
        status: 'draft',
        created_at: '2025-01-01',
      },
    ])
  })

  it('shows jobs title and table when data loads', async () => {
    renderPage()

    expect(screen.getByText('jobs.title')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('Widget')).toBeInTheDocument()
  })

  it('shows empty state when there are no jobs', async () => {
    vi.mocked(fetchJobs).mockResolvedValue([])

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('jobs.empty')).toBeInTheDocument()
    })
  })

  it('asks for confirmation when leaving paid status', async () => {
    vi.mocked(fetchJobs).mockResolvedValue([
      {
        id: 'JX',
        client_id: 'CL1',
        description: 'Paid job',
        status: 'paid',
        price: 10,
        created_at: '2025-01-01',
      },
    ])

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
