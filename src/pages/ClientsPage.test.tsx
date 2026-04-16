import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ClientsPage } from './ClientsPage'
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
        metadataVersion: '2.0.0',
      },
    })
    useWorkbookStore.getState().reset()
    useWorkbookStore.setState({
      status: 'ready',
      spreadsheetId: 'csv-fixture-happy-path',
      error: null,
      tabs: {
        clients: [
          [...SHEET_HEADERS.clients],
          ['CL1', 'Test Co', '', '', '', '', '', '', '2025-01-01', '', ''],
        ],
        tags: [[...SHEET_HEADERS.tags]],
        tag_links: [[...SHEET_HEADERS.tag_links]],
      },
    })
  })

  it('renders clients title and table when workbook is ready', async () => {
    renderPage()

    expect(screen.getByText('clients.title')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('Test Co')).toBeInTheDocument()
  })

  it('shows empty state when there are no clients', async () => {
    useWorkbookStore.setState({
      tabs: {
        clients: [[...SHEET_HEADERS.clients]],
        tags: [[...SHEET_HEADERS.tags]],
        tag_links: [[...SHEET_HEADERS.tag_links]],
      },
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('clients.empty')).toBeInTheDocument()
    })
  })
})
