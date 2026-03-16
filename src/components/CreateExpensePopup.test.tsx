import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateExpensePopup } from './CreateExpensePopup'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockCreateExpense = vi.fn()
vi.mock('@/services/expense/createExpense', () => ({
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
}))

describe('CreateExpensePopup', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  beforeEach(() => {
    mockCreateExpense.mockReset()
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
        onClose={onSuccess}
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
})
