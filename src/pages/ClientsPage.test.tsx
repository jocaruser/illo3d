import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ClientsPage } from './ClientsPage'
import { useShopStore } from '@/stores/shopStore'
import { useSheetsStore } from '@/stores/sheetsStore'
import { fetchClients } from '@/services/sheets/clients'
import { fetchTags } from '@/services/sheets/tags'
import { fetchTagLinks } from '@/services/sheets/tagLinks'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/services/sheets/connection', () => ({
  connect: vi.fn().mockResolvedValue({ ok: true, spreadsheetId: 'csv-fixture-happy-path' }),
}))

vi.mock('@/services/sheets/clients', () => ({
  fetchClients: vi.fn(),
}))

vi.mock('@/services/sheets/tags', () => ({
  fetchTags: vi.fn(),
}))

vi.mock('@/services/sheets/tagLinks', () => ({
  fetchTagLinks: vi.fn(),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ClientsPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('ClientsPage', () => {
  beforeEach(() => {
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
    vi.mocked(fetchClients).mockResolvedValue([
      { id: 'CL1', name: 'Test Co', created_at: '2025-01-01' },
    ])
    vi.mocked(fetchTags).mockResolvedValue([])
    vi.mocked(fetchTagLinks).mockResolvedValue([])
  })

  it('shows connecting then renders clients title and table', async () => {
    renderPage()

    expect(screen.getByText('clients.title')).toBeInTheDocument()
    expect(screen.getByText('errors.connectionConnecting')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('errors.connectionConnecting')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('Test Co')).toBeInTheDocument()
  })

  it('shows empty state when fetch returns no clients', async () => {
    vi.mocked(fetchClients).mockResolvedValue([])

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('clients.empty')).toBeInTheDocument()
    })
  })
})
