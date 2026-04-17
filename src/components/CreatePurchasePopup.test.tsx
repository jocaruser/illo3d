import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreatePurchasePopup } from './CreatePurchasePopup'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockCreatePurchase = vi.fn()
vi.mock('@/services/purchase/createPurchase', () => ({
  createPurchase: (...args: unknown[]) => mockCreatePurchase(...args),
}))

vi.mock('@/hooks/useWorkbookEntities', () => ({
  useWorkbookEntities: vi.fn(),
}))

import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'

const baseEntities = {
  clients: [],
  jobs: [],
  pieces: [],
  pieceItems: [],
  crmNotes: [],
  transactions: [],
  lots: [],
  tags: [],
  tagLinks: [],
  inventory: [
    {
      id: 'INV1',
      type: 'filament' as const,
      name: 'PLA',
      qty_current: 100,
      warn_yellow: 0,
      warn_orange: 0,
      warn_red: 0,
      created_at: '2025-01-01',
      archived: '',
      deleted: '',
    },
  ],
}

describe('CreatePurchasePopup', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  beforeEach(() => {
    mockCreatePurchase.mockReset()
    onClose.mockClear()
    onSuccess.mockClear()
    vi.mocked(useWorkbookEntities).mockReturnValue(baseEntities)
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <CreatePurchasePopup
        isOpen={false}
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />,
    )
    expect(screen.queryByTestId('purchase-dialog')).not.toBeInTheDocument()
  })

  it('renders form fields when open', () => {
    render(
      <CreatePurchasePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />,
    )
    expect(screen.getByTestId('purchase-dialog')).toBeInTheDocument()
    expect(screen.getByText('purchase.title')).toBeInTheDocument()
    expect(document.getElementById('purchase-date')).toBeTruthy()
    expect(document.getElementById('purchase-notes')).toBeTruthy()
    expect(document.getElementById('purchase-amount')).toBeTruthy()
  })

  it('shows line items when add-to-inventory is checked', () => {
    render(
      <CreatePurchasePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />,
    )
    fireEvent.click(screen.getByLabelText(/purchase\.addToInventory/))
    expect(screen.getByText('purchase.lineExisting')).toBeInTheDocument()
    expect(screen.getByText('purchase.lineNew')).toBeInTheDocument()
    expect(document.getElementById('purchase-amount')).toBeNull()
  })

  it('shows validation errors when required fields are empty', () => {
    render(
      <CreatePurchasePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />,
    )
    fireEvent.click(screen.getByText('purchase.submit'))
    expect(mockCreatePurchase).not.toHaveBeenCalled()
    expect(screen.getAllByText('purchase.validation.required').length).toBeGreaterThan(0)
  })

  it('calls createPurchase and callbacks for valid overhead purchase', async () => {
    mockCreatePurchase.mockResolvedValue(undefined)
    render(
      <CreatePurchasePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />,
    )
    fireEvent.change(document.getElementById('purchase-date')!, {
      target: { value: '2025-06-01' },
    })
    fireEvent.change(document.getElementById('purchase-notes')!, {
      target: { value: 'Electric bill' },
    })
    fireEvent.change(document.getElementById('purchase-amount')!, {
      target: { value: '42.5' },
    })
    fireEvent.click(screen.getByText('purchase.submit'))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(mockCreatePurchase).toHaveBeenCalledWith('spreadsheet-1', {
      date: '2025-06-01',
      category: 'other',
      notes: 'Electric bill',
      addToInventory: false,
      amount: 42.5,
    })
    expect(onClose).toHaveBeenCalled()
  })
})
