import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InventoryDetailPage } from './InventoryDetailPage'
import { useShopStore } from '@/stores/shopStore'
import { matrixToInventory, matrixToLots } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

function renderDetail(path = '/inventory/INV1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/inventory/:inventoryId" element={<InventoryDetailPage />} />
        <Route path="/inventory" element={<div data-testid="inventory-list-fallback">list</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('InventoryDetailPage', () => {
  beforeEach(() => {
    useShopStore.setState({
      activeShop: {
        folderId: 't',
        folderName: 't',
        spreadsheetId: 'test-ss',
        metadataVersion: '2.0.0',
      },
    })
    useWorkbookStore.getState().reset()
  })

  it('saves qty_current without changing lots', async () => {
    resetAndSeedWorkbook({
      inventory: matrixWithRows('inventory', [
        {
          id: 'INV1',
          type: 'filament',
          name: 'PLA',
          qty_current: 100,
          warn_yellow: 0,
          warn_orange: 0,
          warn_red: 0,
          created_at: '2025-01-01',
          archived: '',
          deleted: '',
        },
      ]),
      lots: matrixWithRows('lots', [
        {
          id: 'L1',
          inventory_id: 'INV1',
          transaction_id: 'T1',
          quantity: 50,
          amount: 10,
          created_at: '2025-01-02',
          archived: '',
          deleted: '',
        },
      ]),
      transactions: matrixWithRows('transactions', [
        {
          id: 'T1',
          date: '2025-01-02',
          type: 'expense',
          amount: -10,
          category: 'c',
          concept: 'Buy',
          ref_type: '',
          ref_id: '',
          client_id: '',
          notes: '',
          archived: '',
          deleted: '',
        },
      ]),
    })

    const user = userEvent.setup()
    renderDetail()

    await waitFor(() => {
      expect(screen.getByTestId('inventory-detail-qty-current')).toBeInTheDocument()
    })

    await user.clear(screen.getByTestId('inventory-detail-qty-current'))
    await user.type(screen.getByTestId('inventory-detail-qty-current'), '88')
    await user.click(screen.getByTestId('inventory-detail-save-qty'))

    await waitFor(() => {
      const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
      expect(inv.find((i) => i.id === 'INV1')?.qty_current).toBe(88)
      const lots = matrixToLots(useWorkbookStore.getState().tabs.lots)
      expect(lots.find((l) => l.id === 'L1')?.quantity).toBe(50)
    })
  })

  it('archives inventory and lots then navigates to list', async () => {
    resetAndSeedWorkbook({
      inventory: matrixWithRows('inventory', [
        {
          id: 'INV1',
          type: 'filament',
          name: 'PLA',
          qty_current: 10,
          warn_yellow: 0,
          warn_orange: 0,
          warn_red: 0,
          created_at: '2025-01-01',
          archived: '',
          deleted: '',
        },
      ]),
      lots: matrixWithRows('lots', [
        {
          id: 'L1',
          inventory_id: 'INV1',
          transaction_id: 'T1',
          quantity: 10,
          amount: 5,
          created_at: '2025-01-02',
          archived: '',
          deleted: '',
        },
      ]),
    })

    const user = userEvent.setup()
    renderDetail()

    await waitFor(() => {
      expect(screen.getByTestId('entity-detail-delete')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('entity-detail-delete'))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'lifecycle.archive' }))

    await waitFor(() => {
      expect(screen.getByTestId('inventory-list-fallback')).toBeInTheDocument()
    })

    const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(inv.find((i) => i.id === 'INV1')?.archived).toBe('true')
    const lots = matrixToLots(useWorkbookStore.getState().tabs.lots)
    expect(lots.find((l) => l.id === 'L1')?.archived).toBe('true')
  })
})
