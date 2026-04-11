import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateExpensePopup } from './CreateExpensePopup'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockCreateExpense = vi.fn()
const mockUpdateExpense = vi.fn()
vi.mock('@/services/expense/createExpense', () => ({
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
}))
vi.mock('@/services/expense/updateExpense', () => ({
  updateExpense: (...args: unknown[]) => mockUpdateExpense(...args),
}))

describe('CreateExpensePopup', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  beforeEach(() => {
    mockCreateExpense.mockReset()
    mockUpdateExpense.mockReset()
    onClose.mockClear()
    onSuccess.mockClear()
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <CreateExpensePopup
        isOpen={false}
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    expect(screen.queryByText('expenses.title')).not.toBeInTheDocument()
  })

  it('renders form when isOpen is true', () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    expect(screen.getByText('expenses.title')).toBeInTheDocument()
    expect(screen.getByLabelText('expenses.date')).toBeInTheDocument()
    expect(screen.getByLabelText('expenses.category')).toBeInTheDocument()
    expect(screen.getByLabelText('expenses.amount')).toBeInTheDocument()
    expect(screen.getByText('expenses.submit')).toBeInTheDocument()
  })

  it('shows validation error when amount is zero', async () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('expenses.date'), {
      target: { value: '2025-01-20' },
    })
    fireEvent.change(screen.getByLabelText('expenses.amount'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByText('expenses.submit'))

    expect(mockCreateExpense).not.toHaveBeenCalled()
    expect(screen.getByText('expenses.validation.amountPositive')).toBeInTheDocument()
  })

  it('shows validation error when amount is negative', async () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('expenses.date'), {
      target: { value: '2025-01-20' },
    })
    fireEvent.change(screen.getByLabelText('expenses.amount'), {
      target: { value: '-10' },
    })
    fireEvent.click(screen.getByText('expenses.submit'))

    expect(mockCreateExpense).not.toHaveBeenCalled()
  })

  it('calls createExpense and onSuccess when form is valid', async () => {
    mockCreateExpense.mockResolvedValue(undefined)

    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('expenses.date'), {
      target: { value: '2025-01-20' },
    })
    fireEvent.change(screen.getByLabelText('expenses.amount'), {
      target: { value: '50' },
    })
    fireEvent.click(screen.getByText('expenses.submit'))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    expect(mockCreateExpense).toHaveBeenCalledWith('spreadsheet-1', {
      date: '2025-01-20',
      category: 'other',
      amount: 50,
      notes: undefined,
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('hides inventory fields when add-to-inventory is unchecked', () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    expect(
      screen.getByRole('checkbox', { name: 'expenses.addToInventory' })
    ).not.toBeChecked()
    expect(screen.queryByLabelText('expenses.inventoryTypeLabel')).toBeNull()
    expect(screen.queryByLabelText('expenses.inventoryName')).toBeNull()
  })

  it('shows inventory fields when add-to-inventory is checked', () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'expenses.addToInventory' })
    )
    expect(screen.getByLabelText('expenses.inventoryTypeLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('expenses.inventoryName')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/expenses\.quantity expenses\.quantityHintGrams/)
    ).toBeInTheDocument()
  })

  it('hides inventory fields again when add-to-inventory is unchecked', () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    const toggle = screen.getByRole('checkbox', {
      name: 'expenses.addToInventory',
    })
    fireEvent.click(toggle)
    expect(screen.getByLabelText('expenses.inventoryName')).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(screen.queryByLabelText('expenses.inventoryName')).toBeNull()
  })

  it('prefills inventory name from notes when toggle is checked', () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('expenses.notes'), {
      target: { value: 'PLA roll' },
    })
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'expenses.addToInventory' })
    )
    expect(screen.getByLabelText('expenses.inventoryName')).toHaveValue('PLA roll')
  })

  it('shows quantity hint for units when inventory type is consumable', () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'expenses.addToInventory' })
    )
    fireEvent.change(screen.getByLabelText('expenses.inventoryTypeLabel'), {
      target: { value: 'consumable' },
    })
    expect(
      screen.getByLabelText(/expenses\.quantity expenses\.quantityHintUnits/)
    ).toBeInTheDocument()
  })

  it('rejects empty inventory name when add-to-inventory is checked', () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('expenses.date'), {
      target: { value: '2025-01-20' },
    })
    fireEvent.change(screen.getByLabelText('expenses.amount'), {
      target: { value: '10' },
    })
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'expenses.addToInventory' })
    )
    fireEvent.change(screen.getByLabelText('expenses.inventoryName'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByText('expenses.submit'))
    expect(mockCreateExpense).not.toHaveBeenCalled()
    expect(
      screen.getByText('expenses.validation.inventoryNameRequired')
    ).toBeInTheDocument()
  })

  it('rejects zero inventory quantity when add-to-inventory is checked', () => {
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('expenses.date'), {
      target: { value: '2025-01-20' },
    })
    fireEvent.change(screen.getByLabelText('expenses.amount'), {
      target: { value: '10' },
    })
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'expenses.addToInventory' })
    )
    fireEvent.change(screen.getByLabelText('expenses.inventoryName'), {
      target: { value: 'Item' },
    })
    fireEvent.change(
      screen.getByLabelText(/expenses\.quantity expenses\.quantityHintGrams/),
      { target: { value: '0' } }
    )
    fireEvent.click(screen.getByText('expenses.submit'))
    expect(mockCreateExpense).not.toHaveBeenCalled()
    expect(
      screen.getByText('expenses.validation.quantityPositive')
    ).toBeInTheDocument()
  })

  it('does not validate inventory when add-to-inventory is unchecked', async () => {
    mockCreateExpense.mockResolvedValue(undefined)
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('expenses.date'), {
      target: { value: '2025-01-20' },
    })
    fireEvent.change(screen.getByLabelText('expenses.amount'), {
      target: { value: '25' },
    })
    fireEvent.click(screen.getByText('expenses.submit'))
    await waitFor(() => expect(mockCreateExpense).toHaveBeenCalled())
    expect(mockCreateExpense).toHaveBeenCalledWith(
      'spreadsheet-1',
      expect.objectContaining({ inventory: undefined })
    )
  })

  it('passes inventory to createExpense when toggle is checked and form is valid', async () => {
    mockCreateExpense.mockResolvedValue(undefined)
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('expenses.date'), {
      target: { value: '2025-01-20' },
    })
    fireEvent.change(screen.getByLabelText('expenses.amount'), {
      target: { value: '29.99' },
    })
    fireEvent.change(screen.getByLabelText('expenses.notes'), {
      target: { value: 'PLA' },
    })
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'expenses.addToInventory' })
    )
    fireEvent.change(
      screen.getByLabelText(/expenses\.quantity expenses\.quantityHintGrams/),
      { target: { value: '500' } }
    )
    fireEvent.click(screen.getByText('expenses.submit'))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(mockCreateExpense).toHaveBeenCalledWith('spreadsheet-1', {
      date: '2025-01-20',
      category: 'other',
      amount: 29.99,
      notes: 'PLA',
      inventory: { type: 'filament', name: 'PLA', quantity: 500 },
    })
  })

  it('edit mode shows edit title and calls updateExpense', async () => {
    mockUpdateExpense.mockResolvedValue(undefined)
    render(
      <CreateExpensePopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
        initialExpense={{
          id: 'E1',
          date: '2025-01-10',
          category: 'other',
          amount: 10,
          notes: 'x',
        }}
      />
    )
    expect(screen.getByText('expenses.editTitle')).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'expenses.addToInventory' })
    ).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('expenses.amount'), {
      target: { value: '15' },
    })
    fireEvent.click(screen.getByText('expenses.save'))
    await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalled())
    expect(mockUpdateExpense).toHaveBeenCalledWith('spreadsheet-1', 'E1', {
      date: '2025-01-10',
      category: 'other',
      amount: 15,
      notes: 'x',
    })
    expect(mockCreateExpense).not.toHaveBeenCalled()
  })
})
